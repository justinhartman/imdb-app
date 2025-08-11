/**
 * Integration tests for the main application routes
 * Tests the basic routing functionality and request/response handling
 * using mocked controllers to avoid external dependencies
 */

import express from 'express';
import request from 'supertest';

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

import appRouter from '../../../routes/app';

/**
 * Creates an Express application instance with the main app router mounted
 * @returns Express application instance configured for testing
 */
const buildApp = () => {
  const app = express();
  app.use('/', appRouter);
  return app;
};

/**
 * Test suite for main application routes integration
 * Verifies routing behavior, parameter handling, and error cases
 */
describe('app integration', () => {
  test('GET / should return ok from mocked controller', async () => {
    const app = buildApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: 'home' });
  });

  test('GET /search should pass through query', async () => {
    const app = buildApp();
    const res = await request(app).get('/search?q=batman&type=movie');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, route: 'search' });
    expect(res.body.query).toMatchObject({ q: 'batman', type: 'movie' });
  });

  test('Non-existent route returns 404', async () => {
    const app = buildApp();
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});
