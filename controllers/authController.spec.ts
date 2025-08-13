import passport from 'passport';
import authController from './authController';
import User from '../models/User';

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
    const findOne = jest.spyOn(User, 'findOne').mockRejectedValue(new Error('boom'));
    const req: any = makeReq({ username: 'u', password: 'p' });
    const res: any = makeRes();

    await authController.postRegister(req, res, jest.fn());

    expect(findOne).toHaveBeenCalledWith({ username: 'u' });
    expect(req.flash).toHaveBeenCalledWith('error_msg', expect.stringMatching(/Failed to register/i));
    expect(res.redirect).toHaveBeenCalledWith('/user/register');
  });

  test('postRegister redirects when user exists', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue({} as any);
    const req: any = makeReq({ username: 'u', password: 'p' });
    const res: any = makeRes();

    await authController.postRegister(req, res, jest.fn());

    expect(findOne).toHaveBeenCalledWith({ username: 'u' });
    expect(res.redirect).toHaveBeenCalledWith('/user/register');
  });

  test('postRegister saves new user when not exists', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const save = jest.spyOn(User.prototype, 'save').mockResolvedValue(undefined as any);
    const req: any = makeReq({ username: 'u', password: 'p' });
    const res: any = makeRes();

    await authController.postRegister(req, res, jest.fn());

    expect(save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('success_msg', 'You are now registered and can log in');
    expect(res.redirect).toHaveBeenCalledWith('/user/login');
  });

  test('postLogin: passport.authenticate throws -> catch block', async () => {
    const req: any = makeReq({ username: 'x', password: 'y' });
    const res: any = makeRes();
    const next = jest.fn();

    const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => {
      return () => {
        throw new Error('auth fail');
      };
    }) as any;

    await authController.postLogin(req, res, next);

    expect(spy).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('error_msg', expect.stringMatching(/Failed to authenticate/));
    expect(res.redirect).toHaveBeenCalledWith('/user/login');
  });

  test('logout passes error to next', () => {
    const req: any = makeReq();
    const res: any = makeRes();
    const next = jest.fn();
    req.logout = (cb: any) => cb(new Error('boom'));

    authController.logout(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('logout flashes success on success', () => {
    const req: any = makeReq();
    const res: any = makeRes();
    req.logout = (cb: any) => cb();

    authController.logout(req, res, jest.fn());

    expect(req.flash).toHaveBeenCalledWith(
      'success_msg',
      'You are now logged out of the app.'
    );
    expect(res.redirect).toHaveBeenCalledWith('/');
  });
});
