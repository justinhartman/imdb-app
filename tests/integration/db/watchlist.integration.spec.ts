/**
 * Integration tests for the watchlist functionality.
 * Tests the watchlist routes with mocked authentication and database interactions.
 */

import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

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
    router.use(bodyParser.urlencoded({ extended: false }));
    router.use((req: any, _res: any, next: any) => {
      req.flash = jest.fn();
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
  default: {
    find: jest.fn(async ({ userId }: any) => [{ userId, items: (mem[userId]?.items) || [] }]),
    findOne: jest.fn(async ({ userId }: any) => mem[userId] || null),
  },
}));

import watchlistRouter from '../../../routes/watchlist';

/**
 * Creates an Express application instance with watchlist routes mounted.
 * @returns {express.Application} Configured Express application
 */
const buildApp = () => {
  const app = express();
  app.use('/watchlist', watchlistRouter);
  return app;
};

/**
 * Integration tests for watchlist functionality
 * Tests adding/removing items and viewing the watchlist
 */
describe('watchlist integration', () => {
  beforeEach(() => {
    mem['user-1'] = { items: [] };
  });

  test('GET /watchlist - should return 200 and render watchlist page', async () => {
    const app = buildApp();

    // Mock-authenticate every request (no DB/user seed needed)
    (app.request as any).isAuthenticated = () => true;
    (app.request as any).user = { _id: '<test-user-id>', username: '<test-username>' };

    // Stub res.render globally so any render returns 200 + JSON
    (app.response as any).render = function (_view: string, data?: any) {
      return this.status(200).json({ ok: true, data });
    };

    const watchlistRes = await request(app).get('/watchlist');
    expect(watchlistRes.status).toBe(200);
    expect(watchlistRes.body.ok).toBe(true);
  });

  test('POST /watchlist/add - should add new item to watchlist', async () => {
    const app = buildApp();
    const r = await request(app)
      .post('/watchlist/add')
      .type('form')
      .send({ imdbId: 'tt123', title: 'Title', poster: 'p', type: 'movie' });
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe('/watchlist');
    expect(mem['user-1'].items).toEqual([
      { imdbId: 'tt123', title: 'Title', poster: 'p', type: 'movie' },
    ]);
  });

  test('POST /watchlist/delete - should remove item from watchlist', async () => {
    mem['user-1'] = { items: [ { imdbId: 'tt123', title: 'T', poster: 'p', type: 'movie' } ] };
    const app = buildApp();
    const r = await request(app)
      .post('/watchlist/delete')
      .type('form')
      .send({ imdbId: 'tt123' });
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe('/watchlist');
    expect(mem['user-1'].items).toEqual([]);
  });
});
