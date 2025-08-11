import { describe, expect, it, jest } from '@jest/globals';
import { ensureAuthenticated } from './auth';

describe('ensureAuthenticated', () => {
  it('calls next when authenticated', () => {
    const req = { isAuthenticated: () => true } as any;
    const res = { redirect: jest.fn() } as any;
    const next = jest.fn();
    ensureAuthenticated(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('redirects when not authenticated', () => {
    const req = { isAuthenticated: () => false } as any;
    const res = { redirect: jest.fn() } as any;
    const next = jest.fn();
    ensureAuthenticated(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/user/login');
    expect(next).not.toHaveBeenCalled();
  });
});
