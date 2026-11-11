import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index';

// In-memory mock database implementing D1Database interface for integration testing
function createMockD1Database() {
  const tables: Record<string, any[]> = {
    Customers: [
      { Id: 1, Name: 'Alice Johnson', Email: 'alice@example.com', IsVip: 1, Balance: 1500.5 },
      { Id: 2, Name: 'Bob Smith', Email: 'bob@example.com', IsVip: 0, Balance: 200.0 },
      { Id: 3, Name: 'Charlie Brown', Email: 'charlie@example.com', IsVip: 1, Balance: 3400.0 },
      { Id: 4, Name: 'Diana Prince', Email: 'diana@example.com', IsVip: 0, Balance: 90.0 },
    ],
    Orders: [
      { OrderId: 101, CustomerId: 1, Total: 250.0, OrderDate: '2024-01-15' },
      { OrderId: 102, CustomerId: 3, Total: 1200.0, OrderDate: '2024-01-16' },
    ],
  };

  const tableColumns: Record<string, any[]> = {
    Customers: [
      { cid: 0, name: 'Id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'Name', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 2, name: 'Email', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
      { cid: 3, name: 'IsVip', type: 'BOOLEAN', notnull: 0, dflt_value: null, pk: 0 },
      { cid: 4, name: 'Balance', type: 'REAL', notnull: 0, dflt_value: null, pk: 0 },
    ],
    Orders: [
      { cid: 0, name: 'OrderId', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'CustomerId', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 2, name: 'Total', type: 'REAL', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 3, name: 'OrderDate', type: 'DATETIME', notnull: 0, dflt_value: null, pk: 0 },
    ],
  };

  return {
    prepare(query: string) {
      let boundParams: any[] = [];
      const trimmed = query.trim();

      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return stmt;
        },
        async all<T = unknown>() {
          // Table listing query
          if (trimmed.includes('FROM sqlite_master')) {
            return {
              results: Object.keys(tables).map((name) => ({ name })),
              success: true,
              meta: {},
            };
          }

          // PRAGMA table_info
          const pragmaMatch = trimmed.match(/PRAGMA table_info\("?([a-zA-Z0-9_]+)"?\)/i);
          if (pragmaMatch) {
            const tbl = pragmaMatch[1];
            return {
              results: tableColumns[tbl] || [],
              success: true,
              meta: {},
            };
          }

          // Table data query
          const tableMatch = trimmed.match(/FROM "([a-zA-Z0-9_]+)"/i);
          if (tableMatch) {
            const tbl = tableMatch[1];
            let data = [...(tables[tbl] || [])];

            // Filter simulation if IsVip
            if (trimmed.includes('"IsVip" = ?') && boundParams.length > 0) {
              const vipVal = boundParams[0];
              data = data.filter((d) => d.IsVip === vipVal);
            }

            // Pagination simulation (LIMIT ? OFFSET ?)
            if (trimmed.includes('LIMIT ? OFFSET ?')) {
              const limit = boundParams[boundParams.length - 2];
              const offset = boundParams[boundParams.length - 1];
              data = data.slice(offset, offset + limit);
            }

            return {
              results: data as T[],
              success: true,
              meta: {},
            };
          }

          return { results: [], success: true, meta: {} };
        },
        async first<T = unknown>() {
          // Single entity by PK: WHERE "Id" = ? LIMIT 1
          const pkMatch = trimmed.match(/FROM "([a-zA-Z0-9_]+)" WHERE "([a-zA-Z0-9_]+)" = \? LIMIT 1/i);
          if (pkMatch) {
            const tbl = pkMatch[1];
            const pkCol = pkMatch[2];
            const keyVal = boundParams[0];
            const found = (tables[tbl] || []).find((row) => String(row[pkCol]) === String(keyVal));
            return (found || null) as T;
          }

          // Count query: SELECT COUNT(*) AS count FROM ...
          if (trimmed.includes('COUNT(*) AS count')) {
            const tblMatch = trimmed.match(/FROM "([a-zA-Z0-9_]+)"/i);
            const tbl = tblMatch ? tblMatch[1] : '';
            let data = tables[tbl] || [];
            if (trimmed.includes('"IsVip" = ?') && boundParams.length > 0) {
              data = data.filter((d) => d.IsVip === boundParams[0]);
            }
            return { count: data.length } as T;
          }

          return null;
        },
      };

      return stmt;
    },
  } as unknown as D1Database;
}

const authHeader = 'Basic ' + Buffer.from('admin:password123').toString('base64');
const mockEnv = {
  DB: createMockD1Database(),
  BASIC_AUTH_USER: 'admin',
  BASIC_AUTH_PASS: 'password123',
  ODATA_SERVICE_ROOT: '/odata',
  DEFAULT_PAGE_SIZE: '100',
  MAX_PAGE_SIZE: '1000',
};

test('GET /odata returns OData Service Document with EntitySets', async () => {
  const req = new Request('http://localhost/odata', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('Content-Type')?.includes('application/json'));

  const body = (await res.json()) as any;
  assert.equal(body['@odata.context'], 'http://localhost/odata/$metadata');
  assert.equal(body.value.length, 2);
  assert.equal(body.value[0].name, 'Customers');
  assert.equal(body.value[1].name, 'Orders');
});

test('GET /odata/$metadata returns EDMX XML schema', async () => {
  const req = new Request('http://localhost/odata/$metadata', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('Content-Type')?.includes('application/xml'));

  const xml = await res.text();
  assert.ok(xml.includes('<edmx:Edmx Version="4.0"'));
  assert.ok(xml.includes('<EntityType Name="Customers">'));
  assert.ok(xml.includes('<Property Name="IsVip" Type="Edm.Boolean"'));
  assert.ok(xml.includes('<EntitySet Name="Customers" EntityType="D1Gateway.Customers" />'));
});

test('GET /odata/Customers returns OData collection envelope with boolean conversion', async () => {
  const req = new Request('http://localhost/odata/Customers', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  const body = (await res.json()) as any;
  assert.equal(body['@odata.context'], 'http://localhost/odata/$metadata#Customers');
  assert.equal(body.value.length, 4);
  assert.equal(body.value[0].Name, 'Alice Johnson');
  assert.equal(body.value[0].IsVip, true); // Cast from 1 to true
  assert.equal(body.value[1].IsVip, false); // Cast from 0 to false
});

test('GET /odata/Customers with $top and nextLink calculation', async () => {
  const req = new Request('http://localhost/odata/Customers?$filter=IsVip%20eq%20true&$top=2', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  const body = (await res.json()) as any;
  assert.equal(body.value.length, 2);
  assert.ok(body['@odata.nextLink']);
  assert.ok(body['@odata.nextLink'].includes('$skip=2'));
  assert.ok(body['@odata.nextLink'].includes('$top=2'));
  assert.ok(body['@odata.nextLink'].includes('$filter=IsVip+eq+true'));
});

test('GET /odata/Customers with $count=true returns @odata.count', async () => {
  const req = new Request('http://localhost/odata/Customers?$count=true', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  const body = (await res.json()) as any;
  assert.equal(body['@odata.count'], 4);
  assert.equal(body.value.length, 4);
});

test('GET /odata/Customers/$count returns raw plain text count', async () => {
  const req = new Request('http://localhost/odata/Customers/$count', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('Content-Type')?.includes('text/plain'));

  const countText = await res.text();
  assert.equal(countText, '4');
});

test('GET /odata/Customers(1) returns single entity', async () => {
  const req = new Request('http://localhost/odata/Customers(1)', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  const body = (await res.json()) as any;
  assert.equal(body['@odata.context'], 'http://localhost/odata/$metadata#Customers/$entity');
  assert.equal(body.Id, 1);
  assert.equal(body.Name, 'Alice Johnson');
  assert.equal(body.IsVip, true);
});

test('GET /odata/Customers(999) returns 404', async () => {
  const req = new Request('http://localhost/odata/Customers(999)', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 404);

  const body = (await res.json()) as any;
  assert.equal(body.error.code, 'ResourceNotFound');
});

test('GET /odata/NonExistentTable returns 404', async () => {
  const req = new Request('http://localhost/odata/NonExistentTable', {
    headers: { Authorization: authHeader },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 404);

  const body = (await res.json()) as any;
  assert.equal(body.error.code, 'ResourceNotFound');
});

