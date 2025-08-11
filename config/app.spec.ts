import { afterEach, describe, expect, it } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

describe('appConfig', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('builds mongo uri from credentials and uses APP_URL when provided', () => {
    process.env.MONGO_USERNAME = 'user';
    process.env.MONGO_PASSWORD = 'pass';
    process.env.MONGO_HOST = 'localhost';
    process.env.MONGO_PORT = '27017';
    process.env.APP_URL = 'https://example.com';

    const config = require('./app').default;
    expect(config.MONGO_DB_URI).toBe('mongodb://user:pass@localhost:27017');
    expect(config.APP_URL).toBe('https://example.com');
  });

  it('uses MONGO_URI and default APP_URL when credentials missing', () => {
    delete process.env.MONGO_USERNAME;
    delete process.env.MONGO_PASSWORD;
    process.env.MONGO_URI = 'mongodb://other';
    delete process.env.APP_URL;
    delete process.env.VERCEL_URL;

    const config = require('./app').default;
    expect(config.MONGO_DB_URI).toBe('mongodb://other');
    expect(config.APP_URL).toBe('http://localhost:3000');
  });

  it('constructs APP_URL from VERCEL_URL when APP_URL not provided', () => {
    process.env.MONGO_URI = 'mongodb://other';
    delete process.env.APP_URL;
    process.env.VERCEL_URL = 'myapp.vercel.app';

    const config = require('./app').default;
    expect(config.APP_URL).toBe('https://myapp.vercel.app');
  });
});
