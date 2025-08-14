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

    const bodyParser = require('body-parser');
    const session = require('express-session');
    const { default: MongoStore } = require('connect-mongo');
    const passport = require('passport');

    const router: any = { use: jest.fn() };
    dbSession(router);

    // passport config applied at module import
    expect(passportConfig).toHaveBeenCalled();

    // body parser configured
    expect(bodyParser.urlencoded).toHaveBeenCalledWith({ extended: false });

    // MongoStore created with correct options
    expect(MongoStore.create).toHaveBeenCalledWith({ mongoUrl: 'mongodb://localhost', dbName: 'db' });

    // express-session configured with correct options (store result used)
    expect(session).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
        store: 'mongoStore',
      })
    );

    // router.use called with middlewares, including passport.initialize() and passport.session()
    const used = router.use.mock.calls.map((c: any[]) => c[0]);
    expect(used).toEqual(['bp', 'sessionMw', 'flashMw', expect.any(Function), 'initMw', 'sessMw']);

    // Execute flash middleware to cover internal callback and locals assignments
    const flashMiddleware = used[3];
    const req: any = {
      flash: jest
        .fn()
        .mockReturnValueOnce('ok')
        .mockReturnValueOnce('errMsg')
        .mockReturnValueOnce('err'),
    };
    const res: any = { locals: {} };
    const next = jest.fn();
    flashMiddleware(req, res, next);
    expect(res.locals.success_msg).toBe('ok');
    expect(res.locals.error_msg).toBe('errMsg');
    expect(res.locals.error).toBe('err');
    expect(next).toHaveBeenCalled();

    // Ensure passport initialize/session creators were invoked
    expect(passport.initialize).toHaveBeenCalled();
    expect(passport.session).toHaveBeenCalled();
  });
});
