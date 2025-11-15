/**
 * Integration tests for the health check routes
 * Tests the routing functionality and request/response handling
 * for all health check endpoints
 */

import healthRouter from '../../../routes/health';

/**
 * Mock the controller to avoid network dependencies
 */
jest.mock('../../../controllers/healthController', () => ({
  __esModule: true,
  default: {
    checkVidsrc: (req: any, res: any) =>
      res.status(200).json({ domain: 'vidsrcme.su', status: 'up', statusCode: 200 }),
    checkMulti: (req: any, res: any) =>
      res.status(200).json({ domain: 'multiembed.mov', status: 'up', statusCode: 200 }),
    checkApp: (req: any, res: any) =>
      res.status(200).json({ domain: 'localhost:3000', status: 'up', statusCode: 200 }),
    checkAll: (req: any, res: any) =>
      res.status(200).json({
        vidsrc: { domain: 'vidsrcme.su', status: 'up' },
        multi: { domain: 'multiembed.mov', status: 'up' },
        app: { domain: 'localhost:3000', status: 'up' },
        allHealthy: true,
      }),
  },
}));

const findRoute = (method: 'get' | 'post', path: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = (healthRouter as any).stack.find(
    (entry: any) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer ? layer.route.stack[0].handle : undefined;
};

const createMockRes = () => {
  const res: any = { statusCode: 200, headers: {}, locals: {}, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    return res;
  };
  res.send = res.json;
  return res;
};

/**
 * Test suite for health check routes integration
 * Verifies routing behavior and response handling
 */
describe('health routes integration', () => {
  test('GET /vidsrc should return vidsrc domain health', async () => {
    const handler = findRoute('get', '/vidsrc');
    expect(handler).toBeDefined();
    const res = createMockRes();
    await handler!({ params: {}, query: {} }, res, jest.fn());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      domain: 'vidsrcme.su',
      status: 'up',
      statusCode: 200,
    });
  });

  test('GET /multi should return multi domain health', async () => {
    const handler = findRoute('get', '/multi');
    expect(handler).toBeDefined();
    const res = createMockRes();
    await handler!({ params: {}, query: {} }, res, jest.fn());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      domain: 'multiembed.mov',
      status: 'up',
      statusCode: 200,
    });
  });

  test('GET /app should return app domain health', async () => {
    const handler = findRoute('get', '/app');
    expect(handler).toBeDefined();
    const res = createMockRes();
    await handler!({ params: {}, query: {} }, res, jest.fn());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      domain: 'localhost:3000',
      status: 'up',
      statusCode: 200,
    });
  });

  test('GET /all should return all domain health statuses', async () => {
    const handler = findRoute('get', '/all');
    expect(handler).toBeDefined();
    const res = createMockRes();
    await handler!({ params: {}, query: {} }, res, jest.fn());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      vidsrc: { domain: 'vidsrcme.su', status: 'up' },
      multi: { domain: 'multiembed.mov', status: 'up' },
      app: { domain: 'localhost:3000', status: 'up' },
      allHealthy: true,
    });
  });

  test('Non-existent route returns undefined', async () => {
    const handler = findRoute('get', '/nonexistent');
    expect(handler).toBeUndefined();
  });

  test('POST method on health routes should not exist', async () => {
    const vidsrcPost = findRoute('post', '/vidsrc');
    const multiPost = findRoute('post', '/multi');
    const appPost = findRoute('post', '/app');
    const allPost = findRoute('post', '/all');

    expect(vidsrcPost).toBeUndefined();
    expect(multiPost).toBeUndefined();
    expect(appPost).toBeUndefined();
    expect(allPost).toBeUndefined();
  });
});
