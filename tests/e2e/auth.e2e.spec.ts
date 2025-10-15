/**
 * End-to-end tests for authentication functionality
 * Tests user authentication flow, including:
 * - Register
 * - Login redirects
 * - Authentication checks
 * - Session handling
 * - Logout
 */

import passport from 'passport';
import { createRouterAgent } from '../utils/routerAgent';

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
    router.use((req: any, res: any, next: any) => {
      req.flash = jest.fn();
      const cookie = String(req.headers?.cookie || '');
      req._authed = cookie.includes('sid=1');
      req.isAuthenticated = () => !!req._authed;
      req.logout = (cb: any) => {
        res.setHeader('Set-Cookie', 'sid=; Max-Age=0');
        req._authed = false;
        cb();
      };
      res.locals = res.locals || {};
      res.locals.APP_URL = 'http://app.test';
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
 * Authentication Flow Test Suite
 */
describe('auth end to end', () => {
  beforeEach(() => {
    for (const key of Object.keys(memUsers)) {
      delete memUsers[key];
    }
  });

  test('unauthenticated → register → login → profile redirect and profile view', async () => {
    const agent = createRouterAgent(authRouter, '/user');

    // Unauthenticated profile should redirect to login
    const r1 = await agent.get('/user/profile');
    expect(r1.statusCode).toBe(302);
    expect(r1.headers.location).toBe('/user/login');

    // Visit register page
    const r2 = await agent.get('/user/register');
    expect(r2.statusCode).toBe(200);
    expect(r2.body.view).toBe('register');

    // Register user "good"
    const r3 = await agent.post('/user/register', { username: 'good', password: 'secret' });
    expect(r3.statusCode).toBe(302);
    expect(r3.headers.location).toBe('/user/login');

    // Login
    const r4 = await agent.post('/user/login', { username: 'good', password: 'secret' });
    expect(r4.statusCode).toBe(302);
    expect(r4.headers.location).toBe('/user/profile');

    // Access profile after login
    const r5 = await agent.get('/user/profile');
    expect(r5.statusCode).toBe(200);
    expect(r5.body.view).toBe('profile');
  });

  test('register → login → profile → logout flow', async () => {
    const agent = createRouterAgent(authRouter, '/user');

    // Register and login
    await agent.post('/user/register', { username: 'good', password: 'x' });
    const loginRes = await agent.post('/user/login', { username: 'good', password: 'x' });
    expect(loginRes.statusCode).toBe(302);
    expect(loginRes.headers.location).toBe('/user/profile');

    // Confirm profile
    const profileRes = await agent.get('/user/profile');
    expect(profileRes.statusCode).toBe(200);

    // Logout
    const r6 = await agent.get('/user/logout');
    expect(r6.statusCode).toBe(302);
    expect(r6.headers.location).toBe('/');

    // After logout, profile should redirect to login
    const r7 = await agent.get('/user/profile');
    expect(r7.statusCode).toBe(302);
    expect(r7.headers.location).toBe('/user/login');
  });
});
