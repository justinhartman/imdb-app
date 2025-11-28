jest.mock('../../../controllers/healthController', () => ({
  __esModule: true,
  default: {
    getEmbedDomains: (_req: any, res: any) => res.json({ ok: true }),
    getAppUrl: (_req: any, res: any) => res.json({ status: 'ok' }),
  },
}));

import healthRouter from '../../../routes/health';

describe('health routes', () => {
  const findRoute = (method: 'get', path: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = (healthRouter as any).stack.find(
      (entry: any) => entry.route && entry.route.path === path && entry.route.methods[method]
    );
    return layer ? layer.route.stack[0].handle : undefined;
  };

  const createMockRes = () => {
    const res: any = { statusCode: 200, body: undefined };
    res.json = (payload: unknown) => {
      res.body = payload;
      return res;
    };
    return res;
  };

  test('GET /domains should exist and invoke controller', async () => {
    const handler = findRoute('get', '/domains');
    expect(handler).toBeDefined();

    const res = createMockRes();
    const payload = { ok: true };
    const next = jest.fn();
    await handler!({}, res, next);
    expect(res.body).toEqual(payload);
    expect(next).not.toHaveBeenCalled();
  });

  test('GET /app should exist and invoke controller', async () => {
    const handler = findRoute('get', '/app');
    expect(handler).toBeDefined();

    const res = createMockRes();
    const next = jest.fn();
    await handler!({}, res, next);
    expect(res.body).toEqual({ status: 'ok' });
    expect(next).not.toHaveBeenCalled();
  });
});
