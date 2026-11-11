import type { Context, Next } from 'hono';
import { secureCompare } from '../utils/crypto';
import { formatODataError } from '../utils/odataError';
import type { Env } from '../types';

/**
 * Basic Authentication Middleware for OData D1 Gateway.
 * Validates credentials using constant-time comparison against BASIC_AUTH_USER and BASIC_AUTH_PASS.
 */
export async function basicAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Allow preflight CORS requests without authentication
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    c.header('WWW-Authenticate', 'Basic realm="OData D1 Gateway", charset="UTF-8"');
    c.header('OData-Version', '4.0');
    return c.json(
      formatODataError('Unauthorized', 'Authentication is required to access this resource.'),
      401
    );
  }

  const base64Credentials = authHeader.slice(6).trim();
  let decoded: string;
  try {
    decoded = atob(base64Credentials);
  } catch {
    c.header('WWW-Authenticate', 'Basic realm="OData D1 Gateway", charset="UTF-8"');
    c.header('OData-Version', '4.0');
    return c.json(
      formatODataError('Unauthorized', 'Invalid base64 encoding in Authorization header.'),
      401
    );
  }

  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) {
    c.header('WWW-Authenticate', 'Basic realm="OData D1 Gateway", charset="UTF-8"');
    c.header('OData-Version', '4.0');
    return c.json(
      formatODataError('Unauthorized', 'Malformed credentials format in Authorization header.'),
      401
    );
  }

  const providedUser = decoded.slice(0, colonIdx);
  const providedPass = decoded.slice(colonIdx + 1);

  const expectedUser = c.env.BASIC_AUTH_USER ?? 'admin';
  const expectedPass = c.env.BASIC_AUTH_PASS ?? '';

  if (!expectedPass) {
    // If BASIC_AUTH_PASS is not configured, deny access securely
    return c.json(
      formatODataError(
        'ConfigurationError',
        'BASIC_AUTH_PASS is not configured on the server. Please set it using wrangler secret put BASIC_AUTH_PASS.'
      ),
      500
    );
  }

  const isUserValid = await secureCompare(providedUser, expectedUser);
  const isPassValid = await secureCompare(providedPass, expectedPass);

  if (!isUserValid || !isPassValid) {
    c.header('WWW-Authenticate', 'Basic realm="OData D1 Gateway", charset="UTF-8"');
    c.header('OData-Version', '4.0');
    return c.json(
      formatODataError('Unauthorized', 'Invalid username or password.'),
      401
    );
  }

  return next();
}

