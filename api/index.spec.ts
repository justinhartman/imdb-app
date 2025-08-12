jest.mock('path', () => ({ join: jest.fn() }));
jest.mock('@vercel/analytics', () => ({ inject: jest.fn() }));

const mockApp = () => ({
  use: jest.fn(),
  set: jest.fn(),
  listen: jest.fn((_p: any, _h: any, cb: any) => cb && cb()),
});

const expressMock: any = jest.fn(() => mockApp());
expressMock.static = jest.fn(() => 'static');

jest.mock('express', () => expressMock);

const connectMock = jest.fn(() => Promise.reject(new Error('fail')));
jest.mock('../config/db', () => connectMock);

const appRouter = 'appRouter';
const authRouter = 'authRouter';
const watchlistRouter = 'watchlistRouter';

jest.mock('../routes/app', () => appRouter);
jest.mock('../routes/auth', () => authRouter);
jest.mock('../routes/watchlist', () => watchlistRouter);

const baseConfig = {
  APP_NAME: 'name',
  APP_SUBTITLE: 'sub',
  APP_DESCRIPTION: 'desc',
  APP_URL: 'http://app',
  API_HOST: 'host',
  API_PORT: 1,
};

const loadModule = (useAuth: boolean) => {
  jest.resetModules();
  jest.doMock('../helpers/appHelper', () => ({ useAuth }));
  jest.doMock('../config/app', () => baseConfig);
  return require('./index');
};

describe('api/index', () => {
  test('initialises with auth enabled', () => {
    loadModule(true);
    const app = expressMock.mock.results[0].value;
    const localsMiddleware = app.use.mock.calls[0][0];
    const res: any = { locals: {} };
    localsMiddleware({}, res, () => {});
    expect(res.locals.APP_NAME).toBe('name');
    expect(res.locals.CARD_TYPE).toBe('card-add');
    expect(connectMock).toHaveBeenCalled();
    expect(app.use).toHaveBeenCalledWith('/', appRouter);
    expect(app.use).toHaveBeenCalledWith('/user', authRouter);
    expect(app.use).toHaveBeenCalledWith('/watchlist', watchlistRouter);
    expect(app.listen).toHaveBeenCalled();
  });

  test('skips auth when disabled', () => {
    expressMock.mockClear();
    loadModule(false);
    const app = expressMock.mock.results[0].value;
    const localsMiddleware = app.use.mock.calls[0][0];
    const res: any = { locals: {} };
    localsMiddleware({}, res, () => {});
    expect(res.locals.CARD_TYPE).toBe('card');
    expect(connectMock).not.toHaveBeenCalled();
    expect(app.use).toHaveBeenCalledWith('/', appRouter);
    expect(app.use).not.toHaveBeenCalledWith('/user', authRouter);
  });
});
