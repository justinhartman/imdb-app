import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock('../config/passport', () => jest.fn());

const bodyParserUse = jest.fn(() => 'bodyParser');
jest.mock('body-parser', () => ({ urlencoded: () => bodyParserUse() }));

const sessionUse = jest.fn(() => 'session');
jest.mock('express-session', () => () => sessionUse());

const flashUse = jest.fn(() => 'flash');
jest.mock('connect-flash', () => () => flashUse());

const mongoCreate = jest.fn((opts?: any) => 'store');
jest.mock('connect-mongo', () => ({ __esModule: true, default: { create: (opts: any) => mongoCreate(opts) } }));

const passportInit = jest.fn(() => 'init');
const passportSess = jest.fn(() => 'sess');
jest.mock('passport', () => ({ initialize: () => passportInit(), session: () => passportSess() }));

describe('dbSessionMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns early when no mongo uri', () => {
    jest.doMock('../config/app', () => ({ MONGO_DB_URI: '', APP_SECRET: 'sec', MONGO_DB_NAME: 'db' }));
    const router = { use: jest.fn() } as any;
    const middleware = require('./dbSession').default;
    middleware(router);
    expect(router.use).not.toHaveBeenCalled();
  });

  it('sets up session when mongo uri provided', () => {
    jest.doMock('../config/app', () => ({ MONGO_DB_URI: 'mongo', APP_SECRET: 'sec', MONGO_DB_NAME: 'db' }));
    const router = { use: jest.fn() } as any;
    const middleware = require('./dbSession').default;
    middleware(router);
    expect(router.use).toHaveBeenCalled();
    expect(bodyParserUse).toHaveBeenCalled();
    expect(sessionUse).toHaveBeenCalled();
    expect(flashUse).toHaveBeenCalled();
    expect(passportInit).toHaveBeenCalled();
    expect(passportSess).toHaveBeenCalled();
    expect(mongoCreate).toHaveBeenCalledWith({ mongoUrl: 'mongo', dbName: 'db' });
  });
});
