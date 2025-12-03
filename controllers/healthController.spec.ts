import { Request, Response } from 'express';

import appConfig from '../config/app';
import httpClient from '../helpers/httpClient';
import healthController, { checkDomainHealth } from './healthController';

jest.mock('../helpers/httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

type MockedHttpClient = jest.Mocked<typeof httpClient>;
const mockedHttpClient = httpClient as MockedHttpClient;

describe('checkDomainHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns error when domain is not configured', async () => {
    const result = await checkDomainHealth('VIDSRC_DOMAIN', undefined);
    expect(result).toEqual({
      name: 'VIDSRC_DOMAIN',
      status: 'error',
      message: 'Domain not configured',
    });
  });

  test('returns success when endpoint responds with < 400 status', async () => {
    mockedHttpClient.get.mockResolvedValue({ status: 200 } as any);
    const result = await checkDomainHealth('VIDSRC_DOMAIN', 'vidsrc.example');
    expect(result).toEqual({
      name: 'VIDSRC_DOMAIN',
      domain: 'vidsrc.example',
      status: 'success',
      httpStatus: 200,
    });
    expect(mockedHttpClient.get).toHaveBeenCalledWith('https://vidsrc.example', expect.any(Object));
  });

  test('returns error when endpoint responds with >= 400 status', async () => {
    mockedHttpClient.get.mockResolvedValue({ status: 404 } as any);
    const result = await checkDomainHealth('VIDSRC_DOMAIN', 'vidsrc.example');
    expect(result).toEqual({
      name: 'VIDSRC_DOMAIN',
      domain: 'vidsrc.example',
      status: 'error',
      httpStatus: 404,
      message: 'Received status code 404',
    });
  });

  test('returns error when request throws', async () => {
    mockedHttpClient.get.mockRejectedValue(new Error('boom'));
    const result = await checkDomainHealth('VIDSRC_DOMAIN', 'vidsrc.example');
    expect(result).toEqual({
      name: 'VIDSRC_DOMAIN',
      domain: 'vidsrc.example',
      status: 'error',
      message: 'boom',
    });
  });
});

describe('healthController', () => {
  const createRes = () => {
    const res: Partial<Response> = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (appConfig as any).VIDSRC_DOMAIN = 'vidsrc.example';
    (appConfig as any).MULTI_DOMAIN = 'multi.example';
    (appConfig as any).APP_URL = 'https://app.example';
  });

  test('getEmbedDomains returns results for both domains', async () => {
    mockedHttpClient.get
      .mockResolvedValueOnce({ status: 200 } as any)
      .mockResolvedValueOnce({ status: 503 } as any);

    const res = createRes();
    await healthController.getEmbedDomains({ query: {} } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      domains: [
        {
          name: 'VIDSRC_DOMAIN',
          domain: 'vidsrc.example',
          status: 'success',
          httpStatus: 200,
        },
        {
          name: 'MULTI_DOMAIN',
          domain: 'multi.example',
          status: 'error',
          httpStatus: 503,
          message: 'Received status code 503',
        },
      ],
    });
  });

  test('getAppUrl returns single domain result', async () => {
    mockedHttpClient.get.mockResolvedValue({ status: 301 } as any);
    const res = createRes();
    await healthController.getAppUrl({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      name: 'APP_URL',
      domain: 'https://app.example',
      status: 'success',
      httpStatus: 301,
    });
  });

  test('getEmbedDomains handles missing MULTI_DOMAIN', async () => {
    (appConfig as any).MULTI_DOMAIN = undefined;
    mockedHttpClient.get.mockResolvedValue({ status: 200 } as any);

    const res = createRes();
    await healthController.getEmbedDomains({ query: {} } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      domains: [
        {
          name: 'VIDSRC_DOMAIN',
          domain: 'vidsrc.example',
          status: 'success',
          httpStatus: 200,
        },
        {
          name: 'MULTI_DOMAIN',
          status: 'error',
          message: 'Domain not configured',
        },
      ],
    });
  });

  test('getEmbedDomains filters by target query and returns 200 when healthy', async () => {
    mockedHttpClient.get.mockResolvedValue({ status: 200 } as any);

    const res = createRes();
    await healthController.getEmbedDomains({ query: { target: 'vidsrc' } } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      domains: [
        {
          name: 'VIDSRC_DOMAIN',
          domain: 'vidsrc.example',
          status: 'success',
          httpStatus: 200,
        },
      ],
    });
  });

  test('getEmbedDomains rejects invalid target', async () => {
    const res = createRes();

    await healthController.getEmbedDomains({ query: { target: 'unknown' } } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid target',
      domains: [],
    });
  });

  test('getAppUrl returns 503 when app url is unhealthy', async () => {
    mockedHttpClient.get.mockResolvedValue({ status: 500 } as any);
    const res = createRes();

    await healthController.getAppUrl({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      name: 'APP_URL',
      domain: 'https://app.example',
      status: 'error',
      httpStatus: 500,
      message: 'Received status code 500',
    });
  });
});
