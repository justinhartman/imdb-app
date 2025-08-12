/* eslint-disable @typescript-eslint/no-var-requires */

describe('config/app', () => {
  const originalEnv = { ...process.env };

  const clearUrlEnv = () => {
    delete process.env.MONGO_USERNAME;
    delete process.env.MONGO_PASSWORD;
    delete process.env.MONGO_HOST;
    delete process.env.MONGO_PORT;
    delete process.env.MONGO_URI;
    delete process.env.APP_URL;
    delete process.env.VERCEL_URL;
    delete process.env.NODE_ENV;
  };

  const loadConfig = () => {
    jest.resetModules();
    let config: any;
    jest.isolateModules(() => {
      // Require at module evaluation time so env is captured fresh
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      config = require('./app').default;
    });
    return config;
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    clearUrlEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('constructs mongo uri from credentials', () => {
    process.env.MONGO_USERNAME = 'user';
    process.env.MONGO_PASSWORD = 'pass';
    process.env.MONGO_HOST = 'localhost';
    process.env.MONGO_PORT = '27017';
    jest.isolateModules(() => {
      const config = loadConfig();
      expect(config.MONGO_DB_URI).toBe('mongodb://user:pass@localhost:27017');
    });
  });

  test('uses provided mongo uri when credentials missing', () => {
    process.env.MONGO_URI = 'mongodb://example';
    jest.isolateModules(() => {
      const config = loadConfig();
      expect(config.MONGO_DB_URI).toBe('mongodb://example');
    });
  });

  test('app url prefers APP_URL then VERCEL_URL then localhost', () => {
    process.env.APP_URL = undefined;
    process.env.VERCEL_URL = 'vercel.app';
    jest.isolateModules(() => {
      const config = loadConfig();
      expect(config.APP_URL).toBe('https://vercel.app');
    });
  });

  test('prefers APP_URL when provided', () => {
    process.env.APP_URL = 'https://custom.example';
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_URL = 'branch.example';

    const config = loadConfig();
    expect(config.APP_URL).toBe('https://custom.example');
  });

  test('production: falls back to VERCEL_URL if APP_URL missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_URL = undefined;
    process.env.VERCEL_URL = 'branch.example';

    const config = loadConfig();
    expect(config.APP_URL).toBe('https://branch.example');
  });

  test('non-production: uses VERCEL_URL when provided', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_URL = undefined;
    process.env.VERCEL_URL = 'vercel.app';

    const config = loadConfig();
    expect(config.APP_URL).toBe('https://vercel.app');
  });

  test('falls back to localhost when nothing is set', () => {
    const config = loadConfig();
    expect(config.APP_URL).toBe('http://localhost:3000');
  });
});
