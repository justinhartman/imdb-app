/**
 * Integration tests for the main application routes
 * Tests the basic routing functionality and request/response handling
 * using mocked controllers to avoid external dependencies
 */

import appRouter from '../../../routes/app';

/**
 * Mock the controller to avoid network/render dependencies
 */
jest.mock('../../../controllers/appController', () => ({
  __esModule: true,
  default: {
    getHome: (req: any, res: any) => res.status(200).json({ ok: true, route: 'home' }),
    getView: (req: any, res: any) => res.status(200).json({ ok: true, route: 'view', params: req.params }),
    getSearch: (req: any, res: any) => res.status(200).json({ ok: true, route: 'search', query: req.query }),
  },
}));
jest.mock('../../../middleware/dbSession', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const findRoute = (method: 'get' | 'post', path: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = (appRouter as any).stack.find(
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
    res.redirect = (location: string) => {
      res.statusCode = res.statusCode === 200 ? 302 : res.statusCode;
      res.headers.location = location;
      return res;
    };
    return res;
};

/**
 * Test suite for main application routes integration
 * Verifies routing behavior, parameter handling, and error cases
 */
describe('app integration', () => {
  test('GET / should return ok from mocked controller', async () => {
    const handler = findRoute('get', '/');
    expect(handler).toBeDefined();
    const res = createMockRes();
    await handler!({ params: {}, query: {} }, res, jest.fn());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, route: 'home' });
  });

  test('GET /search should pass through query', async () => {
    const handler = findRoute('get', '/search');
    expect(handler).toBeDefined();
    const res = createMockRes();
    await handler!({ params: {}, query: { q: 'batman', type: 'movie' } }, res, jest.fn());
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, route: 'search' });
    expect(res.body.query).toMatchObject({ q: 'batman', type: 'movie' });
  });

  test('Non-existent route returns 404', async () => {
    const handler = findRoute('get', '/nope');
    expect(handler).toBeUndefined();
  });
});
