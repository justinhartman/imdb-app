/**
 * Integration tests for authentication routes and middleware
 * Tests register/login/logout flow, authentication checks and redirects
 */

import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import passport from 'passport';

/**
 * Mock Setup:
 * 1. Database/session middleware mock - provides basic request processing
 * 2. Authentication middleware mock - handles auth checking and redirects
 * 3. Passport config mock - prevents real config initialization
 * 4. Passport authenticate mock - simulates login success/failure and sets a cookie to persist auth
 * 5. In-memory User model mock for registration
 */

// In-memory users for registration
const memUsers: Record<string, { username: string; password: string }> = {};

jest.mock('../../../models/User', () => ({
  __esModule: true,
  default: class UserMock {
    username: string;
    password: string;
    constructor({ username, password }: any) {
      this.username = username;
      this.password = password;
    }
    async save() {
      memUsers[this.username] = { username: this.username, password: this.password };
    }
    static async findOne(query: any) {
      const u = memUsers[query.username];
      return u ? new (this as any)(u) : null;
    }
  },
}));

jest.mock('../../../middleware/dbSession', () => ({
  __esModule: true,
  default: (router: any) => {
    router.use(bodyParser.urlencoded({ extended: false }));
    router.use((req: any, res: any, next: any) => {
      req.flash = jest.fn();
      const cookie = String(req.headers.cookie || '');
      req._authed = cookie.includes('sid=1');
      req.isAuthenticated = () => !!req._authed;
      req.logout = (cb: any) => {
        res.setHeader('Set-Cookie', 'sid=; Max-Age=0');
        req._authed = false;
        cb();
      };
      next();
    });
  },
}));

// Use a controllable ensureAuthenticated for testing
jest.mock('../../../middleware/auth', () => ({
  __esModule: true,
  ensureAuthenticated: (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    return res.redirect('/user/login');
  },
}));

// Avoid touching real passport config
jest.mock('../../../config/passport', () => ({
  __esModule: true,
  default: () => undefined,
}));

// Control passport.authenticate behavior and persist cookie
jest.spyOn(passport, 'authenticate').mockImplementation((...args: unknown[]) => {
  const [, opts] = args as [string, { successRedirect: string; failureRedirect: string }];

  return (req: any, res: any, _next?: any) => {
    const { username } = req.body || {};
    if (username === 'good') {
      req._authed = true;
      res.setHeader('Set-Cookie', 'sid=1; Path=/');
      return res.redirect(opts.successRedirect);
    }
    return res.redirect(opts.failureRedirect);
  };
});

import authRouter from '../../../routes/auth';

/**
 * Creates an Express application instance for testing
 * - Mocks view rendering
 * - Configures auth routes
 * @returns Express application
 */
const buildApp = () => {
  const app = express();
  // Override res.render to avoid view engine
  app.use((req: any, res: any, next: any) => {
    res.render = (view: string, data?: any) => res.status(200).json({ view, data });
    next();
  });
  app.use('/user', authRouter);
  return app;
};

describe('auth integration', () => {
  test('GET /user/register renders register view (mocked)', async () => {
    const app = buildApp();
    const res = await request(app).get('/user/register');
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('register');
  });

  test('Unauthenticated GET /user/profile redirects to login', async () => {
    const app = buildApp();
    const res = await request(app).get('/user/profile');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/user/login');
  });

  test('Register → Login success → Profile access', async () => {
    const app = buildApp();
    const agent = request.agent(app);

    // Register
    const r1 = await agent
      .post('/user/register')
      .type('form')
      .send({ username: 'good', password: 'x' });
    expect(r1.status).toBe(302);
    expect(r1.headers.location).toBe('/user/login');

    // Login
    const r2 = await agent
      .post('/user/login')
      .type('form')
      .send({ username: 'good', password: 'x' });
    expect(r2.status).toBe(302);
    expect(r2.headers.location).toBe('/user/profile');

    // Profile should render
    const r3 = await agent.get('/user/profile');
    expect(r3.status).toBe(200);
    expect(r3.body.view).toBe('profile');
  });

  test('Register → Login → Logout, then profile redirects to login', async () => {
    const app = buildApp();
    const agent = request.agent(app);

    await agent.post('/user/register').type('form').send({ username: 'good', password: 'x' });
    await agent.post('/user/login').type('form').send({ username: 'good', password: 'x' });

    // Ensure logged in
    await agent.get('/user/profile').expect(200);

    // Logout
    const r4 = await agent.get('/user/logout');
    expect(r4.status).toBe(302);
    expect(r4.headers.location).toBe('/');

    // Now profile should redirect to login
    const r5 = await agent.get('/user/profile');
    expect(r5.status).toBe(302);
    expect(r5.headers.location).toBe('/user/login');
  });
});
