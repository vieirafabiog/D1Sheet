import type { ColumnInfo } from './schemaService';

export interface FormatCollectionOptions {
  requestUrl: string;
  serviceRootUrl: string;
  tableName: string;
  records: Record<string, unknown>[];
  totalCount?: number;
  limit: number;
  offset: number;
  hasCustomLimit: boolean;
  selectedColumns?: string[];
  columnsInfo?: ColumnInfo[];
}

export interface ODataCollectionResponse {
  '@odata.context': string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: Record<string, unknown>[];
}

export class ODataResponseFormatter {
  /**
   * Formats a collection of database records into an OData v4 compliant response envelope.
   */
  public static formatCollection(options: FormatCollectionOptions): ODataCollectionResponse {
    const {
      requestUrl,
      serviceRootUrl,
      tableName,
      records,
      totalCount,
      limit,
      offset,
      selectedColumns,
      columnsInfo,
    } = options;

    // Format boolean fields according to schema if column types are known
    const normalizedRecords = this.normalizeRecords(records, columnsInfo);

    // Build @odata.context URL
    let context = `${serviceRootUrl}/$metadata#${tableName}`;
    if (selectedColumns && selectedColumns.length > 0 && selectedColumns[0] !== '*') {
      context += `(${selectedColumns.join(',')})`;
    }

    const response: ODataCollectionResponse = {
      '@odata.context': context,
      value: normalizedRecords,
    };

    // Append @odata.count if count query was executed
    if (typeof totalCount === 'number') {
      response['@odata.count'] = totalCount;
    }

    // Append @odata.nextLink if results reached the page limit (indicating there may be more records)
    if (records.length === limit && limit > 0) {
      response['@odata.nextLink'] = this.buildNextLink(requestUrl, offset, records.length, limit);
    }

    return response;
  }

  /**
   * Formats a single database entity into an OData v4 response.
   */
  public static formatSingleEntity(
    serviceRootUrl: string,
    tableName: string,
    record: Record<string, unknown>,
    columnsInfo?: ColumnInfo[]
  ): Record<string, unknown> {
    const normalized = this.normalizeRecords([record], columnsInfo)[0];
    return {
      '@odata.context': `${serviceRootUrl}/$metadata#${tableName}/$entity`,
      ...normalized,
    };
  }

  /**
   * Computes the nextLink URL with preserved filters and updated $skip and $top parameters.
   */
  public static buildNextLink(
    requestUrl: string,
    currentOffset: number,
    recordsReturned: number,
    limit: number
  ): string {
    const url = new URL(requestUrl);
    const nextSkip = currentOffset + recordsReturned;

    url.searchParams.set('$skip', String(nextSkip));
    url.searchParams.set('$top', String(limit));

    // Restore unencoded '$' for standard OData query parameters
    return url.toString().replace(/%24(skip|top|filter|select|orderby|count|inlinecount)/gi, '$$$1');
  }

  /**
   * Normalizes SQLite data types (booleans 0/1 to true/false, datetimes to ISO 8601).
   */
  private static normalizeRecords(
    records: Record<string, unknown>[],
    columnsInfo?: ColumnInfo[]
  ): Record<string, unknown>[] {
    if (!columnsInfo || columnsInfo.length === 0) {
      return records;
    }

    const boolColumns = new Set(
      columnsInfo
        .filter((col) => col.type && col.type.toUpperCase().includes('BOOL'))
        .map((col) => col.name)
    );

    const dateColumns = new Set(
      columnsInfo
        .filter(
          (col) =>
            col.type &&
            (col.type.toUpperCase().includes('DATE') || col.type.toUpperCase().includes('TIME'))
        )
        .map((col) => col.name)
    );

    return records.map((record) => {
      const copy = { ...record };

      // Convert booleans
      for (const colName of boolColumns) {
        if (copy[colName] !== null && copy[colName] !== undefined) {
          copy[colName] = Boolean(copy[colName]);
        }
      }

      // Format ISO 8601 dates for OData DateTimeOffset
      for (const colName of dateColumns) {
        const val = copy[colName];
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(val)) {
          copy[colName] = val.replace(' ', 'T') + 'Z';
        }
      }

      return copy;
    });
  }
}
