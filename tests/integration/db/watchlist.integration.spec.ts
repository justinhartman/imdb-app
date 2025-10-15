/**
 * Integration tests for the watchlist functionality.
 * Tests the watchlist routes with mocked authentication and database interactions.
 */

import { createRouterAgent } from '../../utils/routerAgent';

/**
 * Mock ensureAuthenticated to always allow and set a user id.
 */
jest.mock('../../../middleware/auth', () => ({
  __esModule: true,
  ensureAuthenticated: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1' };
    return next();
  },
}));

/**
 * Mock dbSession to a minimal no-op that adds flash.
 */
jest.mock('../../../middleware/dbSession', () => ({
  __esModule: true,
  default: (router: any) => {
    router.use((req: any, res: any, next: any) => {
      req.flash = jest.fn();
      req.isAuthenticated = () => true;
      req.user = req.user || { id: 'user-1', username: '<test-username>' };
      res.locals = res.locals || {};
      res.locals.APP_URL = 'http://app.test';
      next();
    });
  },
}));

/**
 * In-memory watchlist store.
 */
const mem: Record<string, { items: any[] }> = {};

jest.mock('../../../models/Watchlist', () => ({
  __esModule: true,
  default: class WatchlistMock {
    userId: string;
    items: any[];

    constructor({ userId, items }: any) {
      this.userId = userId;
      this.items = items || [];
    }

    static async find({ userId }: any) {
      const store = mem[userId] || { items: [] };
      return [{ userId, items: [...store.items] }];
    }

    static async findOne({ userId }: any) {
      const store = mem[userId];
      return store ? new WatchlistMock({ userId, items: [...store.items] }) : null;
    }

    async save() {
      mem[this.userId] = { items: this.items.map((item: any) => ({ ...item })) };
    }
  },
}));

import watchlistRouter from '../../../routes/watchlist';
import WatchlistModel from '../../../models/Watchlist';

/**
 * Integration tests for watchlist functionality
 * Tests adding/removing items and viewing the watchlist
 */
describe('watchlist integration', () => {
  beforeEach(() => {
    mem['user-1'] = { items: [] };
  });

  test('GET /watchlist - should return 200 and render watchlist page', async () => {
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const watchlistRes = await agent.get('/watchlist');
    expect(watchlistRes.statusCode).toBe(200);
    expect(watchlistRes.body.view).toBe('watchlist');
  });

  test('POST /watchlist/add - should add new item to watchlist', async () => {
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const r = await agent.post('/watchlist/add', {
      imdbId: 'tt123',
      title: 'Title',
      poster: 'p',
      type: 'movie',
    });
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toBe('/watchlist');
    expect(mem['user-1'].items).toEqual([
      { imdbId: 'tt123', title: 'Title', poster: 'p', type: 'movie' },
    ]);
  });

  test('POST /watchlist/delete - should remove item from watchlist', async () => {
    mem['user-1'] = { items: [ { imdbId: 'tt123', title: 'T', poster: 'p', type: 'movie' } ] };
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const r = await agent.post('/watchlist/delete', { imdbId: 'tt123' });
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toBe('/watchlist');
    expect(mem['user-1'].items).toEqual([]);
  });

  test('GET /watchlist handles empty result set', async () => {
    const originalFind = (WatchlistModel as any).find;
    (WatchlistModel as any).find = jest.fn(async () => null);
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const res = await agent.get('/watchlist');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/watchlist');
    (WatchlistModel as any).find = originalFind;
  });

  test('GET /watchlist handles repository errors', async () => {
    const originalFind = (WatchlistModel as any).find;
    (WatchlistModel as any).find = jest.fn(async () => {
      throw new Error('boom');
    });
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const res = await agent.get('/watchlist');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/watchlist');
    (WatchlistModel as any).find = originalFind;
  });

  test('POST /watchlist/add handles repository error', async () => {
    const originalFindOne = (WatchlistModel as any).findOne;
    (WatchlistModel as any).findOne = jest.fn(async () => {
      throw new Error('boom');
    });
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const res = await agent.post('/watchlist/add', {
      imdbId: 'tt999',
      title: 'Err',
      poster: 'p',
      type: 'movie',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/watchlist');
    (WatchlistModel as any).findOne = originalFindOne;
  });

  test('POST /watchlist/delete handles missing items and errors', async () => {
    const agent = createRouterAgent(watchlistRouter, '/watchlist');
    const missing = await agent.post('/watchlist/delete', { imdbId: 'tt404' });
    expect(missing.statusCode).toBe(302);
    expect(missing.headers.location).toBe('/watchlist');

    const originalFindOne = (WatchlistModel as any).findOne;
    (WatchlistModel as any).findOne = jest.fn(async () => {
      throw new Error('del fail');
    });
    const failing = await agent.post('/watchlist/delete', { imdbId: 'tt500' });
    expect(failing.statusCode).toBe(302);
    expect(failing.headers.location).toBe('/watchlist');
    (WatchlistModel as any).findOne = originalFindOne;
  });
});
