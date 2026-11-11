import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index';

const mockEnv = {
  DB: {} as any,
  BASIC_AUTH_USER: 'testuser',
  BASIC_AUTH_PASS: 'secret123',
  ODATA_SERVICE_ROOT: '/odata',
};

test('OPTIONS preflight returns CORS headers without auth', async () => {
  const req = new Request('http://localhost/odata/Customers', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://example.com',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
});

test('Request without Authorization returns 401 and WWW-Authenticate', async () => {
  const req = new Request('http://localhost/', {
    method: 'GET',
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 401);
  assert.ok(res.headers.get('WWW-Authenticate')?.includes('Basic realm="OData D1 Gateway"'));
  assert.equal(res.headers.get('OData-Version'), '4.0');

  const body = await res.json() as any;
  assert.equal(body.error.code, 'Unauthorized');
  assert.ok(body.error.message);
});

test('Request with invalid credentials returns 401', async () => {
  const authHeader = 'Basic ' + Buffer.from('testuser:wrongpassword').toString('base64');
  const req = new Request('http://localhost/', {
    method: 'GET',
    headers: {
      Authorization: authHeader,
    },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 401);

  const body = await res.json() as any;
  assert.equal(body.error.code, 'Unauthorized');
});

test('Request with valid credentials returns 200 and gateway info', async () => {
  const authHeader = 'Basic ' + Buffer.from('testuser:secret123').toString('base64');
  const req = new Request('http://localhost/', {
    method: 'GET',
    headers: {
      Authorization: authHeader,
    },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('OData-Version'), '4.0');

  const body = await res.json() as any;
  assert.equal(body.protocol, 'OData v4.0');
  assert.equal(body.serviceRoot, '/odata');
});

test('Non-existent route returns 404 with OData error format', async () => {
  const authHeader = 'Basic ' + Buffer.from('testuser:secret123').toString('base64');
  const req = new Request('http://localhost/non-existent-route', {
    method: 'GET',
    headers: {
      Authorization: authHeader,
    },
  });

  const res = await app.fetch(req, mockEnv);
  assert.equal(res.status, 404);

  const body = await res.json() as any;
  assert.equal(body.error.code, 'NotFound');
});

