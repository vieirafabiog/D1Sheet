import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index';

function createMockCrudDatabase() {
  let nextId = 5;
  const customers = [
    { Id: 1, Name: 'Alice Johnson', Email: 'alice@example.com', IsVip: 1, Balance: 1500.5 },
    { Id: 2, Name: 'Bob Smith', Email: 'bob@example.com', IsVip: 0, Balance: 200.0 },
    { Id: 3, Name: 'Charlie Brown', Email: 'charlie@example.com', IsVip: 1, Balance: 3400.0 },
    { Id: 4, Name: 'Diana Prince', Email: 'diana@example.com', IsVip: 0, Balance: 90.0 },
  ];

  const tableColumns: Record<string, any[]> = {
    Customers: [
      { cid: 0, name: 'Id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'Name', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 2, name: 'Email', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
      { cid: 3, name: 'IsVip', type: 'BOOLEAN', notnull: 0, dflt_value: null, pk: 0 },
      { cid: 4, name: 'Balance', type: 'REAL', notnull: 0, dflt_value: null, pk: 0 },
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
          if (trimmed.includes('PRAGMA table_info')) {
            return { results: tableColumns.Customers, success: true, meta: {} };
          }
          return { results: customers as T[], success: true, meta: {} };
        },
        async first<T = unknown>() {
          // PRAGMA table_info
          if (trimmed.includes('PRAGMA table_info')) {
            return null;
          }

          // INSERT ... RETURNING *
          if (trimmed.startsWith('INSERT INTO "Customers"')) {
            const newRow: any = { Id: nextId++ };
            // Query format: INSERT INTO "Customers" ("Name", "Email", "IsVip", "Balance") VALUES (?, ?, ?, ?)
            const colsMatch = trimmed.match(/\((.+)\)\s+VALUES/);
            if (colsMatch) {
              const cols = colsMatch[1].split(',').map((c) => c.trim().replace(/"/g, ''));
              cols.forEach((col, idx) => {
                newRow[col] = boundParams[idx];
              });
            }
            customers.push(newRow);
            return newRow as T;
          }

          // UPDATE ... RETURNING *
          if (trimmed.startsWith('UPDATE "Customers"')) {
            const keyVal = boundParams[boundParams.length - 1];
            const rowIdx = customers.findIndex((c) => String(c.Id) === String(keyVal));
            if (rowIdx === -1) return null;

            // Extract SET columns
            const setMatch = trimmed.match(/SET\s+(.+)\s+WHERE/i);
            if (setMatch) {
              const sets = setMatch[1].split(',').map((s) => s.trim());
              sets.forEach((setClause, idx) => {
                const col = setClause.split('=')[0].trim().replace(/"/g, '');
                customers[rowIdx][col] = boundParams[idx];
              });
            }
            return customers[rowIdx] as T;
          }

          // SELECT ... WHERE "Id" = ? LIMIT 1
          if (trimmed.includes('WHERE "Id" = ?')) {
            const keyVal = boundParams[0];
            const found = customers.find((c) => String(c.Id) === String(keyVal));
            return (found || null) as T;
          }

          return null;
        },
        async run() {
          // DELETE FROM "Customers" WHERE "Id" = ?
          if (trimmed.startsWith('DELETE FROM "Customers"')) {
            const keyVal = boundParams[0];
            const idx = customers.findIndex((c) => String(c.Id) === String(keyVal));
            if (idx !== -1) {
              customers.splice(idx, 1);
            }
            return { success: true, meta: {} };
          }
          return { success: true, meta: {} };
        },
      };

      return stmt;
    },
  } as unknown as D1Database;
}

const authHeader = 'Basic ' + Buffer.from('admin:password123').toString('base64');
const mockEnv = {
  DB: createMockCrudDatabase(),
  BASIC_AUTH_USER: 'admin',
  BASIC_AUTH_PASS: 'password123',
  ODATA_SERVICE_ROOT: '/odata',
};

test('POST /odata/Customers inserts new entity and returns 201 Created', async () => {
  const req = new Request('http://localhost/odata/Customers', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Name: 'Edward Norton',
      Email: 'edward@example.com',
      IsVip: true,
      Balance: 450.0,
    }),
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 201);
  assert.ok(res.headers.get('Location')?.includes('/odata/Customers(5)'));
  assert.equal(res.headers.get('Preference-Applied'), 'return=representation');

  const body = (await res.json()) as any;
  assert.equal(body.Id, 5);
  assert.equal(body.Name, 'Edward Norton');
  assert.equal(body.IsVip, true);
  assert.equal(body['@odata.context'], 'http://localhost/odata/$metadata#Customers/$entity');
});

test('PATCH /odata/Customers(1) updates existing entity and returns 200 OK', async () => {
  const req = new Request('http://localhost/odata/Customers(1)', {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Balance: 9999.0,
      IsVip: false,
    }),
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  const body = (await res.json()) as any;
  assert.equal(body.Id, 1);
  assert.equal(body.Name, 'Alice Johnson'); // Kept unchanged
  assert.equal(body.Balance, 9999.0); // Updated
  assert.equal(body.IsVip, false); // Updated
});

test('PUT /odata/Customers(Id=1) updates entity with named key', async () => {
  const req = new Request('http://localhost/odata/Customers(Id=1)', {
    method: 'PUT',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Balance: 777.7,
    }),
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);

  const body = (await res.json()) as any;
  assert.equal(body.Id, 1);
  assert.equal(body.Balance, 777.7);
});

test('PATCH /odata/Customers(999) returns 404 for non-existent row', async () => {
  const req = new Request('http://localhost/odata/Customers(999)', {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Balance: 100 }),
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 404);

  const body = (await res.json()) as any;
  assert.equal(body.error.code, 'ResourceNotFound');
});

test('DELETE /odata/Customers(2) deletes entity and returns 204 No Content', async () => {
  const req = new Request('http://localhost/odata/Customers(2)', {
    method: 'DELETE',
    headers: {
      Authorization: authHeader,
    },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 204);

  // Subsequent fetch must return 404
  const checkReq = new Request('http://localhost/odata/Customers(2)', {
    headers: { Authorization: authHeader },
  });
  const checkRes = await app.fetch(checkReq, mockEnv);
  assert.equal(checkRes.status, 404);
});

test('DELETE /odata/Customers(999) returns 404 for non-existent row', async () => {
  const req = new Request('http://localhost/odata/Customers(999)', {
    method: 'DELETE',
    headers: {
      Authorization: authHeader,
    },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 404);
});
