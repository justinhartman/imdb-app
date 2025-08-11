/**
 * End-to-end tests for authentication functionality
 * Tests user authentication flow, including:
 * - Register
 * - Login redirects
 * - Authentication checks
 * - Session handling
 * - Logout
 */

import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import passport from 'passport';

/**
 * Mock Setup:
 * - Database/session middleware mock for request processing
 * - Authentication middleware mock for auth checks
 * - Passport configuration and authentication mocks
 * - In-memory User model mock
 */

// In-memory user store for registration mocks
const memUsers: Record<string, { username: string; password: string }> = {};

jest.mock('../../models/User', () => ({
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

jest.mock('../../middleware/dbSession', () => ({
  __esModule: true,
  default: (router: any) => {
    router.use(bodyParser.urlencoded({ extended: false }));
    router.use((req: any, res: any, next: any) => {
      req.flash = jest.fn();
      // emulate session via cookie
      const cookie = String(req.headers.cookie || '');
      req._authed = cookie.includes('sid=1');
      req.isAuthenticated = () => !!req._authed;
      req.logout = (cb: any) => {
        // clear fake session cookie
        res.setHeader('Set-Cookie', 'sid=; Max-Age=0');
        req._authed = false;
        cb();
      };
      next();
    });
  },
}));

jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  ensureAuthenticated: (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    return res.redirect('/user/login');
  },
}));

jest.mock('../../config/passport', () => ({
  __esModule: true,
  default: () => undefined,
}));

jest.spyOn(passport, 'authenticate').mockImplementation((...args: unknown[]) => {
  const [, opts] = args as [string, { successRedirect: string; failureRedirect: string }];

  return (req: any, res: any, _next?: any) => {
    const { username } = req.body || {};
    if (username === 'good') {
      req._authed = true;
      // set a simple cookie to persist auth across agent requests
      res.setHeader('Set-Cookie', 'sid=1; Path=/');
      return res.redirect(opts.successRedirect);
    }
    return res.redirect(opts.failureRedirect);
  };
});

import authRouter from '../../routes/auth';

/**
 * Creates an Express application instance for testing
 * - Mocks view rendering to return JSON
 * - Configures authentication routes
 * @returns Express application
 */
const buildApp = () => {
  const app = express();
  app.use((req: any, res: any, next: any) => {
    res.render = (view: string, data?: any) => res.status(200).json({ view, data });
    next();
  });
  app.use('/user', authRouter);
  return app;
};

/**
 * Authentication Flow Test Suite
 */
describe('auth end to end', () => {
  test('unauthenticated → register → login → profile redirect and profile view', async () => {
    const app = buildApp();
    const agent = request.agent(app);

    // Unauthenticated profile should redirect to login
    const r1 = await agent.get('/user/profile');
    expect(r1.status).toBe(302);
    expect(r1.headers.location).toBe('/user/login');

    // Visit register page
    const r2 = await agent.get('/user/register');
    expect(r2.status).toBe(200);
    expect(r2.body.view).toBe('register');

    // Register user "good"
    const r3 = await agent
      .post('/user/register')
      .type('form')
      .send({ username: 'good', password: 'secret' });
    expect(r3.status).toBe(302);
    expect(r3.headers.location).toBe('/user/login');

    // Login
    const r4 = await agent
      .post('/user/login')
      .type('form')
      .send({ username: 'good', password: 'secret' });
    expect(r4.status).toBe(302);
    expect(r4.headers.location).toBe('/user/profile');

    // Access profile after login
    const r5 = await agent.get('/user/profile');
    expect(r5.status).toBe(200);
    expect(r5.body.view).toBe('profile');
  });

  test('register → login → profile → logout flow', async () => {
    const app = buildApp();
    const agent = request.agent(app);

    // Register and login
    await agent.post('/user/register').type('form').send({ username: 'good', password: 'x' });
    await agent
      .post('/user/login')
      .type('form')
      .send({ username: 'good', password: 'x' })
      .expect(302)
      .expect('Location', '/user/profile');

    // Confirm profile
    await agent.get('/user/profile').expect(200);

    // Logout
    const r6 = await agent.get('/user/logout');
    expect(r6.status).toBe(302);
    expect(r6.headers.location).toBe('/');

    // After logout, profile should redirect to login
    const r7 = await agent.get('/user/profile');
    expect(r7.status).toBe(302);
    expect(r7.headers.location).toBe('/user/login');
  });
});
