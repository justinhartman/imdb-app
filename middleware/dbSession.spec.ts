jest.mock('../config/passport', () => jest.fn());
jest.mock('body-parser', () => ({ urlencoded: jest.fn(() => 'bp') }));
jest.mock('express-session', () => jest.fn(() => 'sessionMw'));
jest.mock('connect-flash', () => jest.fn(() => 'flashMw'));
jest.mock('passport', () => ({
  initialize: jest.fn(() => 'initMw'),
  session: jest.fn(() => 'sessMw'),
}));
jest.mock('connect-mongo', () => ({ __esModule: true, default: { create: jest.fn(() => 'mongoStore') } }));

const createAppMock = (uri: string) => {
  jest.resetModules();
  jest.doMock('../config/app', () => ({
    MONGO_DB_URI: uri,
    APP_SECRET: 'secret',
    MONGO_DB_NAME: 'db',
  }));
  return require('./dbSession').default;
};

describe('middleware/dbSession', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns early when no mongo uri', () => {
    const dbSession = createAppMock('');
    const router: any = { use: jest.fn() };
    dbSession(router);
    expect(router.use).not.toHaveBeenCalled();
  });

  test('configures middleware when mongo uri provided', () => {
    const dbSession = createAppMock('mongodb://localhost');
    const passportConfig = require('../config/passport');
    const router: any = { use: jest.fn() };
    dbSession(router);
    expect(passportConfig).toHaveBeenCalled();
    expect(router.use).toHaveBeenCalled();
    // Execute flash middleware to cover internal callback
    const flashMiddleware = router.use.mock.calls[3][0];
    const req: any = {
      flash: jest.fn().mockReturnValueOnce('ok').mockReturnValueOnce('err').mockReturnValueOnce('err'),
    };
    const res: any = { locals: {} };
    const next = jest.fn();
    flashMiddleware(req, res, next);
    expect(res.locals.success_msg).toBe('ok');
    expect(next).toHaveBeenCalled();
  });
});
