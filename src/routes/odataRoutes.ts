import { Hono } from 'hono';
import type { Env } from '../types';
import { SchemaService } from '../services/schemaService';
import { ODataResponseFormatter } from '../services/odataResponse';
import { ODataSqlTranslator } from '../odata/sqlTranslator';
import { ODataHttpError } from '../utils/odataError';

export const odataRoutes = new Hono<{ Bindings: Env }>();

/**
 * Extracts and reconstructs the base service root URL from the incoming request.
 */
function getServiceRootUrl(urlStr: string, configuredRoot?: string): string {
  const url = new URL(urlStr);
  const root = configuredRoot || '/odata';
  return `${url.origin}${root}`;
}

/**
 * Helper to ensure D1 database binding exists.
 */
function getDatabase(env: Env): D1Database {
  if (!env.DB || typeof env.DB.prepare !== 'function') {
    throw new ODataHttpError(
      500,
      'DatabaseConfigurationError',
      'Cloudflare D1 database binding (DB) is not configured. Please bind a D1 database in wrangler.toml.'
    );
  }
  return env.DB;
}

interface ParsedEntityParam {
  tableName: string;
  keyVal?: string;
  explicitKeyCol?: string;
}

/**
 * Helper to parse entity set and optional key from URL parameter.
 * Supports:
 * - TableName
 * - TableName(1)
 * - TableName('ALFKI')
 * - TableName(Id=1)
 * - TableName(Id='ALFKI')
 * - /TableName/1 (via pathId)
 */
function parseEntityParam(rawParam: string, pathId?: string): ParsedEntityParam {
  if (pathId !== undefined) {
    return { tableName: rawParam, keyVal: pathId };
  }

  const keyMatch = rawParam.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
  if (keyMatch) {
    const tableName = keyMatch[1];
    let keyVal = keyMatch[2].trim();

    let explicitKeyCol: string | undefined;
    if (keyVal.includes('=')) {
      const eqIdx = keyVal.indexOf('=');
      explicitKeyCol = keyVal.slice(0, eqIdx).trim();
      keyVal = keyVal.slice(eqIdx + 1).trim();
    }

    if (
      (keyVal.startsWith("'") && keyVal.endsWith("'")) ||
      (keyVal.startsWith('"') && keyVal.endsWith('"'))
    ) {
      keyVal = keyVal.slice(1, -1);
    }

    return { tableName, keyVal, explicitKeyCol };
  }

  return { tableName: rawParam };
}

// -------------------------------------------------------------
// 1. Service Document (Root /odata)
// -------------------------------------------------------------
odataRoutes.get('/', async (c) => {
  const db = getDatabase(c.env);
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  const tables = await SchemaService.getTableNames(db);
  const doc = SchemaService.generateServiceDocument(tables, serviceRootUrl);

  c.header('Content-Type', 'application/json;odata.metadata=minimal;charset=utf-8');
  return c.json(doc);
});

// -------------------------------------------------------------
// 2. Metadata Document (/$metadata)
// -------------------------------------------------------------
odataRoutes.get('/$metadata', async (c) => {
  const db = getDatabase(c.env);
  const schemas = await SchemaService.getAllTableSchemas(db);
  const xml = SchemaService.generateEdmxXml(schemas);

  return c.body(xml, 200, {
    'Content-Type': 'application/xml;charset=utf-8',
    'OData-Version': '4.0',
  });
});

// -------------------------------------------------------------
// 3. Raw Count Endpoint (/:entitySet/$count)
// -------------------------------------------------------------
odataRoutes.get('/:entitySet/$count', async (c) => {
  const db = getDatabase(c.env);
  const rawEntitySet = c.req.param('entitySet');

  await SchemaService.getTableSchema(db, rawEntitySet);

  const translator = new ODataSqlTranslator();
  const queryParams = c.req.query();
  const query = translator.translate(rawEntitySet, {
    ...queryParams,
    $count: 'true',
  });

  const countSql = query.countSql || `SELECT COUNT(*) AS count FROM "${rawEntitySet}"`;
  const countParams = query.countParams || [];

  const result = await db
    .prepare(countSql)
    .bind(...countParams)
    .first<{ count: number }>();

  const count = result?.count ?? 0;
  return c.body(String(count), 200, {
    'Content-Type': 'text/plain;charset=utf-8',
    'OData-Version': '4.0',
  });
});

// -------------------------------------------------------------
// 4. GET Collection or Single Entity by Parentheses Key
// -------------------------------------------------------------
odataRoutes.get('/:entitySet', async (c) => {
  const db = getDatabase(c.env);
  const rawParam = c.req.param('entitySet');
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  const parsed = parseEntityParam(rawParam);

  // If a key was provided in parentheses (e.g., Customers(1) or Customers(Id=1))
  if (parsed.keyVal !== undefined) {
    return handleSingleEntity(c, db, parsed.tableName, parsed.keyVal, serviceRootUrl, parsed.explicitKeyCol);
  }

  // Otherwise, it is a collection query
  const tableName = parsed.tableName;
  const schema = await SchemaService.getTableSchema(db, tableName);

  const defaultPageSize = c.env.DEFAULT_PAGE_SIZE ? Number(c.env.DEFAULT_PAGE_SIZE) : 100;
  const maxPageSize = c.env.MAX_PAGE_SIZE ? Number(c.env.MAX_PAGE_SIZE) : 1000;

  const translator = new ODataSqlTranslator({ defaultPageSize, maxPageSize });
  const queryParams = c.req.query();
  const query = translator.translate(tableName, queryParams);

  const recordsStmt = db.prepare(query.selectSql).bind(...query.params);
  const { results } = await recordsStmt.all<Record<string, unknown>>();
  const records = results ?? [];

  let totalCount: number | undefined;
  if (query.countSql) {
    const countResult = await db
      .prepare(query.countSql)
      .bind(...(query.countParams ?? []))
      .first<{ count: number }>();
    totalCount = countResult?.count ?? 0;
  }

  const response = ODataResponseFormatter.formatCollection({
    requestUrl: c.req.url,
    serviceRootUrl,
    tableName,
    records,
    totalCount,
    limit: query.limit,
    offset: query.offset,
    hasCustomLimit: query.hasCustomLimit,
    selectedColumns: query.selectedColumns,
    columnsInfo: schema.columns,
  });

  c.header('Content-Type', 'application/json;odata.metadata=minimal;charset=utf-8');
  return c.json(response);
});

// -------------------------------------------------------------
// 5. GET Single Entity by Path ID (/:entitySet/:id)
// -------------------------------------------------------------
odataRoutes.get('/:entitySet/:id', async (c) => {
  const db = getDatabase(c.env);
  const tableName = c.req.param('entitySet');
  const id = c.req.param('id');
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  return handleSingleEntity(c, db, tableName, id, serviceRootUrl);
});

// -------------------------------------------------------------
// 6. POST: Insert New Entity (AppSheet Adds)
// -------------------------------------------------------------
odataRoutes.post('/:entitySet', async (c) => {
  const db = getDatabase(c.env);
  const rawParam = c.req.param('entitySet');
  const { tableName } = parseEntityParam(rawParam);
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  const schema = await SchemaService.getTableSchema(db, tableName);
  const validCols = new Map(schema.columns.map((col) => [col.name, col]));

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ODataHttpError(400, 'InvalidRequestBody', 'Request body must be a valid JSON object.');
  }

  const insertCols: string[] = [];
  const placeholders: string[] = [];
  const insertVals: unknown[] = [];

  for (const [key, val] of Object.entries(body)) {
    // Skip OData system metadata annotations
    if (key.startsWith('@')) continue;

    const colInfo = validCols.get(key);
    if (!colInfo) continue;

    insertCols.push(`"${colInfo.name}"`);
    placeholders.push('?');

    if (typeof val === 'boolean') {
      insertVals.push(val ? 1 : 0);
    } else {
      insertVals.push(val);
    }
  }

  let insertSql: string;
  if (insertCols.length === 0) {
    insertSql = `INSERT INTO "${tableName}" DEFAULT VALUES RETURNING *`;
  } else {
    insertSql = `INSERT INTO "${tableName}" (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  }

  const stmt = db.prepare(insertSql).bind(...insertVals);
  const newRow = await stmt.first<Record<string, unknown>>();

  const pkName = schema.primaryKeys[0];
  const newId = newRow ? newRow[pkName] : undefined;
  const entityUrl = `${serviceRootUrl}/${tableName}(${newId})`;

  const formatted = ODataResponseFormatter.formatSingleEntity(
    serviceRootUrl,
    tableName,
    newRow ?? (body as Record<string, unknown>),
    schema.columns
  );

  c.header('Location', entityUrl);
  c.header('Preference-Applied', 'return=representation');
  c.header('Content-Type', 'application/json;odata.metadata=minimal;charset=utf-8');
  return c.json(formatted, 201);
});

// -------------------------------------------------------------
// 7. PATCH / PUT: Update Existing Entity (AppSheet Updates)
// -------------------------------------------------------------
const handleUpdate = async (c: any) => {
  const db = getDatabase(c.env);
  const rawParam = c.req.param('entitySet');
  const pathId = c.req.param('id');
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  const { tableName, keyVal, explicitKeyCol } = parseEntityParam(rawParam, pathId);

  if (keyVal === undefined) {
    throw new ODataHttpError(400, 'InvalidRequest', 'Entity key must be specified for update (e.g., TableName(id)).');
  }

  const schema = await SchemaService.getTableSchema(db, tableName);
  const pkName = explicitKeyCol || schema.primaryKeys[0];

  // Verify entity exists
  const existingSql = `SELECT * FROM "${tableName}" WHERE "${pkName}" = ? LIMIT 1`;
  const existing = await db.prepare(existingSql).bind(keyVal).first<Record<string, unknown>>();

  if (!existing) {
    throw new ODataHttpError(404, 'ResourceNotFound', `Entity with key '${keyVal}' not found in '${tableName}'.`);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ODataHttpError(400, 'InvalidRequestBody', 'Request body must be a valid JSON object.');
  }

  const updateClauses: string[] = [];
  const updateVals: unknown[] = [];
  const validCols = new Map(schema.columns.map((col) => [col.name, col]));

  for (const [key, val] of Object.entries(body)) {
    if (key.startsWith('@')) continue;

    const colInfo = validCols.get(key);
    if (!colInfo) continue;
    // Do not attempt to update the primary key
    if (colInfo.name === pkName) continue;

    updateClauses.push(`"${colInfo.name}" = ?`);
    if (typeof val === 'boolean') {
      updateVals.push(val ? 1 : 0);
    } else {
      updateVals.push(val);
    }
  }

  let updatedRow = existing;
  if (updateClauses.length > 0) {
    const updateSql = `UPDATE "${tableName}" SET ${updateClauses.join(', ')} WHERE "${pkName}" = ? RETURNING *`;
    updateVals.push(keyVal);
    const stmt = db.prepare(updateSql).bind(...updateVals);
    const res = await stmt.first<Record<string, unknown>>();
    if (res) {
      updatedRow = res;
    }
  }

  const formatted = ODataResponseFormatter.formatSingleEntity(
    serviceRootUrl,
    tableName,
    updatedRow,
    schema.columns
  );

  c.header('Content-Type', 'application/json;odata.metadata=minimal;charset=utf-8');
  return c.json(formatted, 200);
};

odataRoutes.patch('/:entitySet', handleUpdate);
odataRoutes.patch('/:entitySet/:id', handleUpdate);
odataRoutes.put('/:entitySet', handleUpdate);
odataRoutes.put('/:entitySet/:id', handleUpdate);

// -------------------------------------------------------------
// 8. DELETE: Delete Existing Entity (AppSheet Deletes)
// -------------------------------------------------------------
const handleDelete = async (c: any) => {
  const db = getDatabase(c.env);
  const rawParam = c.req.param('entitySet');
  const pathId = c.req.param('id');

  const { tableName, keyVal, explicitKeyCol } = parseEntityParam(rawParam, pathId);

  if (keyVal === undefined) {
    throw new ODataHttpError(400, 'InvalidRequest', 'Entity key must be specified for delete (e.g., TableName(id)).');
  }

  const schema = await SchemaService.getTableSchema(db, tableName);
  const pkName = explicitKeyCol || schema.primaryKeys[0];

  // Verify entity exists
  const existingSql = `SELECT * FROM "${tableName}" WHERE "${pkName}" = ? LIMIT 1`;
  const existing = await db.prepare(existingSql).bind(keyVal).first<Record<string, unknown>>();

  if (!existing) {
    throw new ODataHttpError(404, 'ResourceNotFound', `Entity with key '${keyVal}' not found in '${tableName}'.`);
  }

  const deleteSql = `DELETE FROM "${tableName}" WHERE "${pkName}" = ?`;
  await db.prepare(deleteSql).bind(keyVal).run();

  c.status(204);
  return c.body(null);
};

odataRoutes.delete('/:entitySet', handleDelete);
odataRoutes.delete('/:entitySet/:id', handleDelete);

// -------------------------------------------------------------
// Common handler for GET single entity
// -------------------------------------------------------------
async function handleSingleEntity(
  c: any,
  db: D1Database,
  tableName: string,
  keyVal: string,
  serviceRootUrl: string,
  explicitKeyCol?: string
) {
  const schema = await SchemaService.getTableSchema(db, tableName);
  const pkName = explicitKeyCol || schema.primaryKeys[0];

  const sql = `SELECT * FROM "${tableName}" WHERE "${pkName}" = ? LIMIT 1`;
  const result = await db.prepare(sql).bind(keyVal).first<Record<string, unknown>>();

  if (!result) {
    throw new ODataHttpError(
      404,
      'ResourceNotFound',
      `Entity with key '${keyVal}' not found in '${tableName}'.`
    );
  }

  const formatted = ODataResponseFormatter.formatSingleEntity(
    serviceRootUrl,
    tableName,
    result,
    schema.columns
  );

  c.header('Content-Type', 'application/json;odata.metadata=minimal;charset=utf-8');
  return c.json(formatted);
}
