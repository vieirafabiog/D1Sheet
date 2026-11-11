import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { basicAuthMiddleware } from './middleware/auth';
import { formatODataError, ODataHttpError } from './utils/odataError';

const app = new Hono<{ Bindings: Env }>();

// 1. Global CORS Middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'OData-Version',
      'OData-MaxVersion',
      'Prefer',
      'If-Match',
    ],
    exposeHeaders: [
      'OData-Version',
      'Content-Type',
      'Location',
      'ETag',
      'Preference-Applied',
    ],
    maxAge: 86400,
  })
);

// 2. Global OData response header middleware
app.use('*', async (c, next) => {
  await next();
  // Ensure OData-Version is present on responses
  if (!c.res.headers.has('OData-Version')) {
    c.header('OData-Version', '4.0');
  }
});

// 3. Global Error Handling
app.onError((err, c) => {
  console.error('[OData Gateway Error]:', err);

  c.header('OData-Version', '4.0');

  if (err instanceof ODataHttpError) {
    return c.json(
      formatODataError(err.code, err.message, err.target, err.details),
      err.statusCode as any
    );
  }

  const message =
    err instanceof Error ? err.message : 'An unexpected internal error occurred.';

  return c.json(
    formatODataError('InternalServerError', message),
    500
  );
});

// 4. Global 404 Not Found Handler (OData format)
app.notFound((c) => {
  c.header('OData-Version', '4.0');
  return c.json(
    formatODataError('NotFound', `Resource not found: ${c.req.path}`),
    404
  );
});

// 5. HTTP Basic Authentication Middleware
app.use('*', basicAuthMiddleware);

// Health check and Gateway Info endpoint
app.get('/', (c) => {
  const serviceRoot = c.env.ODATA_SERVICE_ROOT || '/odata';
  return c.json({
    name: 'Cloudflare D1 OData Gateway',
    version: '1.0.0',
    protocol: 'OData v4.0',
    serviceRoot,
    endpoints: {
      metadata: `${serviceRoot}/$metadata`,
      serviceDocument: serviceRoot,
    },
  });
});

export default app;

