import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { basicAuthMiddleware } from './middleware/auth';
import { formatODataError, ODataHttpError } from './utils/odataError';
import { odataRoutes } from './routes/odataRoutes';

const app = new Hono<{ Bindings: Env }>();

// 1. Normalize trailing slash internally without HTTP 301 redirects
app.use('*', async (c, next) => {
  if (c.req.path.length > 1 && c.req.path.endsWith('/')) {
    const newPath = c.req.path.slice(0, -1);
    const newUrl = new URL(c.req.url);
    newUrl.pathname = newPath;
    return app.fetch(new Request(newUrl.toString(), c.req.raw), c.env);
  }
  await next();
});

// 2. Global CORS Middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'OData-Version',
      'OData-MaxVersion',
      'DataServiceVersion',
      'MaxDataServiceVersion',
      'Prefer',
      'If-Match',
      'X-Requested-With',
      'X-CSRF-Token',
      'Cache-Control',
    ],
    exposeHeaders: [
      'OData-Version',
      'DataServiceVersion',
      'Content-Type',
      'Location',
      'ETag',
      'Preference-Applied',
    ],
    maxAge: 86400,
  })
);

// 3. Request Logging & OData-Version Response Header Middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  if (!c.res.headers.has('OData-Version')) {
    c.header('OData-Version', '4.0');
  }
  const ms = Date.now() - start;
  console.log(
    `[D1Sheet] ${c.req.method} ${c.req.path} -> ${c.res.status} (${ms}ms) | Accept=${c.req.header('Accept') || '-'} | UA=${c.req.header('User-Agent') || '-'}`
  );
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
    name: 'D1Sheet',
    description: 'High-performance OData v4 Gateway for Cloudflare D1',
    version: '1.0.0',
    protocol: 'OData v4.0',
    serviceRoot,
    endpoints: {
      metadata: `${serviceRoot}/$metadata`,
      serviceDocument: serviceRoot,
    },
  });
});

// Mount OData routes
app.route('/odata', odataRoutes);

export default app;

