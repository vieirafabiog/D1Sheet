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

// 1. OData Service Document (Root of /odata)
odataRoutes.get('/', async (c) => {
  const db = getDatabase(c.env);
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  const tables = await SchemaService.getTableNames(db);
  const doc = SchemaService.generateServiceDocument(tables, serviceRootUrl);

  c.header('Content-Type', 'application/json;odata.metadata=minimal;charset=utf-8');
  return c.json(doc);
});

// 2. OData Dynamic Metadata Document (/$metadata)
odataRoutes.get('/$metadata', async (c) => {
  const db = getDatabase(c.env);
  const schemas = await SchemaService.getAllTableSchemas(db);
  const xml = SchemaService.generateEdmxXml(schemas);

  return c.body(xml, 200, {
    'Content-Type': 'application/xml;charset=utf-8',
    'OData-Version': '4.0',
  });
});

// 3. Raw Count Endpoint (/:entitySet/$count)
odataRoutes.get('/:entitySet/$count', async (c) => {
  const db = getDatabase(c.env);
  const rawEntitySet = c.req.param('entitySet');

  // Verify entity exists
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

// 4. Entity Set / Single Entity by Parentheses Key (/:entitySet)
// Supports both GET /Customers and GET /Customers(1) or GET /Customers('ALFKI')
odataRoutes.get('/:entitySet', async (c) => {
  const db = getDatabase(c.env);
  const rawParam = c.req.param('entitySet');
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  // Check if request matches entity key in parentheses: TableName(keyValue)
  const keyMatch = rawParam.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
  if (keyMatch) {
    const tableName = keyMatch[1];
    let keyVal = keyMatch[2].trim();
    // Strip surrounding quotes if string literal (e.g., 'ALFKI')
    if (
      (keyVal.startsWith("'") && keyVal.endsWith("'")) ||
      (keyVal.startsWith('"') && keyVal.endsWith('"'))
    ) {
      keyVal = keyVal.slice(1, -1);
    }

    return handleSingleEntity(c, db, tableName, keyVal, serviceRootUrl);
  }

  // Otherwise, it is a collection query
  const tableName = rawParam;
  const schema = await SchemaService.getTableSchema(db, tableName);

  const defaultPageSize = c.env.DEFAULT_PAGE_SIZE ? Number(c.env.DEFAULT_PAGE_SIZE) : 100;
  const maxPageSize = c.env.MAX_PAGE_SIZE ? Number(c.env.MAX_PAGE_SIZE) : 1000;

  const translator = new ODataSqlTranslator({ defaultPageSize, maxPageSize });
  const queryParams = c.req.query();
  const query = translator.translate(tableName, queryParams);

  // Execute records query
  const recordsStmt = db.prepare(query.selectSql).bind(...query.params);
  const { results } = await recordsStmt.all<Record<string, unknown>>();
  const records = results ?? [];

  // Execute count query if requested
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

// 5. Single Entity by Path ID (/:entitySet/:id)
odataRoutes.get('/:entitySet/:id', async (c) => {
  const db = getDatabase(c.env);
  const tableName = c.req.param('entitySet');
  const id = c.req.param('id');
  const serviceRootUrl = getServiceRootUrl(c.req.url, c.env.ODATA_SERVICE_ROOT);

  return handleSingleEntity(c, db, tableName, id, serviceRootUrl);
});

/**
 * Common handler for retrieving a single entity by primary key.
 */
async function handleSingleEntity(
  c: any,
  db: D1Database,
  tableName: string,
  keyVal: string,
  serviceRootUrl: string
) {
  const schema = await SchemaService.getTableSchema(db, tableName);
  const pkName = schema.primaryKeys[0];

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
