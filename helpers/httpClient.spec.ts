import client from './httpClient';
import { AxiosError } from 'axios';

describe('helpers/httpClient', () => {
  let originalAdapter: any;

  beforeEach(() => {
    originalAdapter = client.defaults.adapter;
    jest.useFakeTimers();
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    client.defaults.adapter = originalAdapter;
    jest.useRealTimers();
    (Math.random as jest.Mock).mockRestore();
  });

  test('retries on network error', async () => {
    let attempt = 0;
    client.defaults.adapter = jest.fn(async (config) => {
      attempt++;
      if (attempt === 1) {
        const err: any = new Error('Network Error');
        err.config = config;
        err.code = 'ECONNRESET';
        throw err;
      }
      return { config, data: 'ok', status: 200, statusText: 'OK', headers: {} };
    });

    const promise = client.get('http://example.com');
    await jest.advanceTimersByTimeAsync(300);
    const res = await promise;

    expect(res.data).toBe('ok');
    expect(attempt).toBe(2);
  });

  test('throws original error when config missing', async () => {
    const handler = (client.interceptors.response as any).handlers[0].rejected;
    const err = new AxiosError('boom');
    await expect(handler(err)).rejects.toThrow('boom');
  });

  test('does not retry on non-retryable error', async () => {
    const handler = (client.interceptors.response as any).handlers[0].rejected;
    const err = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', { headers: {} } as any);
    await expect(handler(err)).rejects.toThrow('Bad Request');
  });

  test('has expected default configuration', () => {
    expect(client.defaults.timeout).toBe(10_000);
    expect(client.defaults.maxRedirects).toBe(5);
    expect(client.defaults.headers?.Connection).toBe('close');
  });
});
