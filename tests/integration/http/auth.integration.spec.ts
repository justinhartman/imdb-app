/**
 * Integration tests for authentication routes and middleware
 * Tests register/login/logout flow, authentication checks and redirects
 */

import passport from 'passport';
import { createRouterAgent } from '../../utils/routerAgent';

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

describe('auth integration', () => {
  beforeEach(() => {
    for (const key of Object.keys(memUsers)) {
      delete memUsers[key];
    }
  });

  test('GET /user/register renders register view (mocked)', async () => {
    const agent = createRouterAgent(authRouter, '/user');
    const res = await agent.get('/user/register');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('register');
  });

  test('Unauthenticated GET /user/profile redirects to login', async () => {
    const agent = createRouterAgent(authRouter, '/user');
    const res = await agent.get('/user/profile');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/user/login');
  });

  test('Register → Login success → Profile access', async () => {
    const agent = createRouterAgent(authRouter, '/user');

    const r1 = await agent.post('/user/register', { username: 'good', password: 'x' });
    expect(r1.statusCode).toBe(302);
    expect(r1.headers.location).toBe('/user/login');

    const r2 = await agent.post('/user/login', { username: 'good', password: 'x' });
    expect(r2.statusCode).toBe(302);
    expect(r2.headers.location).toBe('/user/profile');

    const r3 = await agent.get('/user/profile');
    expect(r3.statusCode).toBe(200);
    expect(r3.body.view).toBe('profile');
  });

  test('Register → Login → Logout, then profile redirects to login', async () => {
    const agent = createRouterAgent(authRouter, '/user');

    await agent.post('/user/register', { username: 'good', password: 'x' });
    await agent.post('/user/login', { username: 'good', password: 'x' });

    const ensure = await agent.get('/user/profile');
    expect(ensure.statusCode).toBe(200);

    const r4 = await agent.get('/user/logout');
    expect(r4.statusCode).toBe(302);
    expect(r4.headers.location).toBe('/');

    const r5 = await agent.get('/user/profile');
    expect(r5.statusCode).toBe(302);
    expect(r5.headers.location).toBe('/user/login');
  });
});
