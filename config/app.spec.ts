
describe('config/app', () => {
  afterEach(() => {
    delete process.env.MONGO_USERNAME;
    delete process.env.MONGO_PASSWORD;
    delete process.env.MONGO_HOST;
    delete process.env.MONGO_PORT;
    delete process.env.MONGO_URI;
    delete process.env.APP_URL;
    delete process.env.VERCEL_URL;
    jest.resetModules();
  });

  test('constructs mongo uri from credentials', () => {
    process.env.MONGO_USERNAME = 'user';
    process.env.MONGO_PASSWORD = 'pass';
    process.env.MONGO_HOST = 'localhost';
    process.env.MONGO_PORT = '27017';
    jest.isolateModules(() => {
      const config = require('./app').default;
      expect(config.MONGO_DB_URI).toBe('mongodb://user:pass@localhost:27017');
    });
  });

  test('uses provided mongo uri when credentials missing', () => {
    process.env.MONGO_URI = 'mongodb://example';
    jest.isolateModules(() => {
      const config = require('./app').default;
      expect(config.MONGO_DB_URI).toBe('mongodb://example');
    });
  });

  test('app url prefers APP_URL then VERCEL_URL then localhost', () => {
    process.env.VERCEL_URL = 'vercel.app';
    jest.isolateModules(() => {
      const config = require('./app').default;
      expect(config.APP_URL).toBe('https://vercel.app');
    });
  });
});
