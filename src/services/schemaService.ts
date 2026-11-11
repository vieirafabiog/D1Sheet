import { ODataHttpError } from '../utils/odataError';

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  primaryKeys: string[];
}

export class SchemaService {
  /**
   * Returns list of user tables in the D1 database, filtering out internal SQLite and Cloudflare tables.
   */
  public static async getTableNames(db: D1Database): Promise<string[]> {
    const query = `
      SELECT name FROM sqlite_master 
      WHERE type='table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name NOT LIKE '_cf_%'
        AND name NOT LIKE 'd1_%'
      ORDER BY name;
    `;
    const { results } = await db.prepare(query).all<{ name: string }>();
    return (results ?? []).map((r) => r.name);
  }

  /**
   * Retrieves schema columns for a specific table using PRAGMA table_info.
   */
  public static async getTableSchema(db: D1Database, tableName: string): Promise<TableSchema> {
    // Validate table name identifier
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new ODataHttpError(400, 'InvalidEntitySet', `Invalid table name: '${tableName}'`);
    }

    const { results } = await db.prepare(`PRAGMA table_info("${tableName}")`).all<ColumnInfo>();
    const columns = results ?? [];

    if (columns.length === 0) {
      throw new ODataHttpError(404, 'ResourceNotFound', `Entity set or table '${tableName}' not found.`);
    }

    const primaryKeys = columns
      .filter((c) => c.pk > 0)
      .sort((a, b) => a.pk - b.pk)
      .map((c) => c.name);

    return {
      name: tableName,
      columns,
      primaryKeys: primaryKeys.length > 0 ? primaryKeys : [columns[0].name],
    };
  }

  /**
   * Retrieves schemas for all user tables in the database.
   */
  public static async getAllTableSchemas(db: D1Database): Promise<TableSchema[]> {
    const tableNames = await this.getTableNames(db);
    const schemas: TableSchema[] = [];

    for (const name of tableNames) {
      try {
        const schema = await this.getTableSchema(db, name);
        schemas.push(schema);
      } catch {
        // Skip tables that cannot be read
      }
    }

    return schemas;
  }

  /**
   * Maps SQLite column data types to OData EDM types.
   */
  public static sqliteTypeToEdmType(sqliteType: string): string {
    const upper = (sqliteType || '').toUpperCase().trim();

    if (upper.includes('INT')) {
      if (upper.includes('BIGINT') || upper.includes('INT8') || upper.includes('UNSIGNED BIG INT')) {
        return 'Edm.Int64';
      }
      return 'Edm.Int32';
    }
    if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('DOUBLE')) {
      return 'Edm.Double';
    }
    if (upper.includes('DECIMAL') || upper.includes('NUMERIC')) {
      return 'Edm.Decimal';
    }
    if (upper.includes('BOOL')) {
      return 'Edm.Boolean';
    }
    if (upper.includes('DATETIME') || upper.includes('TIMESTAMP') || upper.includes('DATE')) {
      return 'Edm.DateTimeOffset';
    }
    if (upper.includes('BLOB')) {
      return 'Edm.Binary';
    }

    return 'Edm.String';
  }

  /**
   * Generates OData v4 EDMX XML metadata document.
   */
  public static generateEdmxXml(schemas: TableSchema[], namespace: string = 'D1Gateway'): string {
    const entityTypesXml = schemas
      .map((schema) => {
        const keyPropsXml = schema.primaryKeys
          .map((pk) => `          <PropertyRef Name="${pk}" />`)
          .join('\n');

        const propsXml = schema.columns
          .map((col) => {
            const edmType = this.sqliteTypeToEdmType(col.type);
            const nullable = col.notnull === 0 ? 'true' : 'false';
            return `        <Property Name="${col.name}" Type="${edmType}" Nullable="${nullable}" />`;
          })
          .join('\n');

        return `      <EntityType Name="${schema.name}">
        <Key>
${keyPropsXml}
        </Key>
${propsXml}
      </EntityType>`;
      })
      .join('\n');

    const entitySetsXml = schemas
      .map(
        (schema) =>
          `        <EntitySet Name="${schema.name}" EntityType="${namespace}.${schema.name}" />`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="${namespace}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
${entityTypesXml}
      <EntityContainer Name="DefaultContainer">
${entitySetsXml}
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;
  }

  /**
   * Generates OData Service Document (JSON format).
   */
  public static generateServiceDocument(
    tableNames: string[],
    serviceRootUrl: string
  ): Record<string, unknown> {
    return {
      '@odata.context': `${serviceRootUrl}/$metadata`,
      value: tableNames.map((name) => ({
        name,
        kind: 'EntitySet',
        url: name,
      })),
    };
  }
}
