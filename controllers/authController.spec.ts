import passport from 'passport';
import authController from './authController';

const makeRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.locals = { APP_URL: 'http://localhost:3000' };
  res.render = jest.fn();
  res.redirect = jest.fn();
  return res;
};

const makeReq = (body: any = {}) => {
  const req: any = { body };
  req.flash = jest.fn();
  return req;
};

describe('controllers/authController unit', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getLogin renders login view', async () => {
    const req: any = makeReq();
    const res: any = makeRes();
    const next = jest.fn();

    await authController.getLogin(req, res, next);

    expect(res.render).toHaveBeenCalledWith('login', expect.objectContaining({
      canonical: expect.stringContaining('/user/login'),
      type: 'movie',
    }));
  });

  test('postRegister: User.findOne throws -> catch block', async () => {
    // Reset module registry so mocks apply to fresh imports
    jest.resetModules();

    // Mock the User model BEFORE requiring the controller
    const findOne = jest.fn().mockRejectedValue(new Error('boom'));
    jest.doMock('../models/User', () => ({
      __esModule: true,
      default: { findOne },
    }));

    // Now require the controller so it captures the mocked module
    const authController = require('./authController').default;

    const req: any = makeReq({ username: 'u', password: 'p' });
    const res: any = makeRes();
    const next = jest.fn();

    await authController.postRegister(req, res, next);

    expect(findOne).toHaveBeenCalledWith({ username: 'u' });
    expect(req.flash).toHaveBeenCalledWith('error_msg', expect.stringMatching(/Failed to register/i));
    expect(res.redirect).toHaveBeenCalledWith('/user/register');
  });

  test('postLogin: passport.authenticate throws -> catch block', async () => {
    const req: any = makeReq({ username: 'x', password: 'y' });
    const res: any = makeRes();
    const next = jest.fn();

    const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => {
      return () => { throw new Error('auth fail'); };
    }) as any;

    await authController.postLogin(req, res, next);

    expect(spy).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('error_msg', expect.stringMatching(/Failed to authenticate/));
    expect(res.redirect).toHaveBeenCalledWith('/user/login');
  });
});
