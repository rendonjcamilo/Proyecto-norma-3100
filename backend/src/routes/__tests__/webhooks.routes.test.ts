/**
 * Pruebas de los guards de firma/token en los webhook handlers.
 * Verifica que el secreto compartido SOLO se acepta vía header
 * X-Webhook-Token (no vía query string) y que se rechaza con 401
 * en producción cuando el token es inválido o falta.
 */
import { createWebhooksRouter } from '../webhooks.routes';

type MockReq = {
  body: unknown;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  protocol: string;
  originalUrl: string;
  get: (name: string) => string | undefined;
};

function buildReq(overrides: Partial<MockReq> = {}): MockReq {
  const headers: Record<string, string> = overrides.headers || {};
  return {
    body: overrides.body ?? {},
    query: overrides.query ?? {},
    headers,
    protocol: overrides.protocol ?? 'https',
    originalUrl: overrides.originalUrl ?? '/api/webhooks/test',
    get: (name: string) => headers[name.toLowerCase()] ?? headers[name],
  };
}

function buildRes() {
  const statusCalls: number[] = [];
  const jsonCalls: unknown[] = [];
  const res: any = {
    status(code: number) {
      statusCalls.push(code);
      return res;
    },
    json(body: unknown) {
      jsonCalls.push(body);
      return res;
    },
  };
  return { res, statusCalls, jsonCalls };
}

/**
 * Extrae el handler async registrado para POST {path} del router.
 */
function getHandler(router: ReturnType<typeof createWebhooksRouter>, path: string) {
  const layer = (router as any).stack.find(
    (l: any) => l.route?.path === path && l.route?.methods?.post
  );
  if (!layer) {
    throw new Error(`No se encontró handler POST ${path}`);
  }
  // El último middleware en route.stack es el handler real (tras cualquier middleware previo)
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

describe('webhooks.routes — guard de secreto compartido (header only)', () => {
  const originalEnv = { ...process.env };
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const cases: Array<{ path: string; envVar: string; body: unknown }> = [
    { path: '/email/sendgrid', envVar: 'SENDGRID_WEBHOOK_SECRET', body: [] },
    { path: '/sms/aws-sns', envVar: 'AWS_SNS_WEBHOOK_SECRET', body: { Message: '{}' } },
    { path: '/push/fcm', envVar: 'FCM_WEBHOOK_SECRET', body: {} },
    { path: '/push/apns', envVar: 'APNS_WEBHOOK_SECRET', body: {} },
  ];

  it.each(cases)(
    '$path rechaza con 401 cuando el token solo viene en query string',
    async ({ path, envVar, body }) => {
      process.env[envVar] = 'super-secreto';
      const router = createWebhooksRouter(mockPool as any);
      const handler = getHandler(router, path);

      const req = buildReq({ body, query: { token: 'super-secreto' } });
      const { res, statusCalls, jsonCalls } = buildRes();

      await handler(req, res);

      expect(statusCalls[0]).toBe(401);
      expect(jsonCalls[0]).toEqual({ error: 'Invalid signature' });
    }
  );

  it.each(cases)(
    '$path acepta el token correcto vía header X-Webhook-Token',
    async ({ path, envVar, body }) => {
      process.env[envVar] = 'super-secreto';
      const router = createWebhooksRouter(mockPool as any);
      const handler = getHandler(router, path);

      const req = buildReq({ body, headers: { 'x-webhook-token': 'super-secreto' } });
      const { res, statusCalls } = buildRes();

      await handler(req, res);

      expect(statusCalls).not.toContain(401);
    }
  );

  it.each(cases)(
    '$path rechaza con 401 cuando no hay token ni en header ni en query',
    async ({ path, envVar, body }) => {
      process.env[envVar] = 'super-secreto';
      const router = createWebhooksRouter(mockPool as any);
      const handler = getHandler(router, path);

      const req = buildReq({ body });
      const { res, statusCalls, jsonCalls } = buildRes();

      await handler(req, res);

      expect(statusCalls[0]).toBe(401);
      expect(jsonCalls[0]).toEqual({ error: 'Invalid signature' });
    }
  );
});
