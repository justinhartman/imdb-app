import { ensureAuthenticated } from './auth';

describe('middleware/auth', () => {
  test('calls next when authenticated', () => {
    const req: any = { isAuthenticated: () => true };
    const res: any = { redirect: jest.fn() };
    const next = jest.fn();
    ensureAuthenticated(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('redirects when not authenticated', () => {
    const req: any = { isAuthenticated: () => false };
    const res: any = { redirect: jest.fn() };
    ensureAuthenticated(req, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('/user/login');
  });
});
