import healthController, { checkDomainHealth } from './healthController';
import http from '../helpers/httpClient';

jest.mock('../helpers/httpClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../config/app', () => ({
  VIDSRC_DOMAIN: 'vidsrcme.su',
  MULTI_DOMAIN: 'multiembed.mov',
  APP_URL: 'http://localhost:3000',
}));

describe('controllers/healthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDomainHealth', () => {
    it('should return up status when domain is accessible', async () => {
      const mockDate = '2025-01-15T10:00:00.000Z';
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        toISOString: () => mockDate,
      } as any));

      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await checkDomainHealth('example.com', 'https');

      expect(result).toEqual({
        domain: 'example.com',
        status: 'up',
        statusCode: 200,
        checkedAt: mockDate,
      });
      expect(http.get).toHaveBeenCalledWith('https://example.com', expect.any(Object));

      jest.restoreAllMocks();
    });

    it('should return down status when domain is not accessible', async () => {
      const mockDate = '2025-01-15T10:00:00.000Z';
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        toISOString: () => mockDate,
      } as any));

      (http.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await checkDomainHealth('down.example.com', 'https');

      expect(result).toEqual({
        domain: 'down.example.com',
        status: 'down',
        error: 'Network error',
        checkedAt: mockDate,
      });

      jest.restoreAllMocks();
    });

    it('should handle HTTP protocol', async () => {
      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      await checkDomainHealth('example.com', 'http');

      expect(http.get).toHaveBeenCalledWith('http://example.com', expect.any(Object));
    });

    it('should accept status codes less than 500 as up', async () => {
      const validateStatus = (http.get as jest.Mock).mock.calls[0]?.[1]?.validateStatus;

      (http.get as jest.Mock).mockResolvedValue({
        status: 404,
        data: {},
      });

      await checkDomainHealth('example.com', 'https');

      const lastCallValidateStatus = (http.get as jest.Mock).mock.calls[
        (http.get as jest.Mock).mock.calls.length - 1
      ][1].validateStatus;

      expect(lastCallValidateStatus(200)).toBe(true);
      expect(lastCallValidateStatus(404)).toBe(true);
      expect(lastCallValidateStatus(499)).toBe(true);
      expect(lastCallValidateStatus(500)).toBe(false);
      expect(lastCallValidateStatus(503)).toBe(false);
    });
  });

  describe('checkVidsrc', () => {
    it('should return 200 when VIDSRC_DOMAIN is up', async () => {
      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkVidsrc(req, res, jest.fn());

      expect(http.get).toHaveBeenCalledWith('https://vidsrcme.su', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'vidsrcme.su',
          status: 'up',
          statusCode: 200,
        })
      );
    });

    it('should return 503 when VIDSRC_DOMAIN is down', async () => {
      (http.get as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkVidsrc(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'vidsrcme.su',
          status: 'down',
          error: 'Connection refused',
        })
      );
    });
  });

  describe('checkMulti', () => {
    it('should return 200 when MULTI_DOMAIN is up', async () => {
      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkMulti(req, res, jest.fn());

      expect(http.get).toHaveBeenCalledWith('https://multiembed.mov', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'multiembed.mov',
          status: 'up',
          statusCode: 200,
        })
      );
    });

    it('should return 503 when MULTI_DOMAIN is down', async () => {
      (http.get as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkMulti(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'multiembed.mov',
          status: 'down',
          error: 'Timeout',
        })
      );
    });

    it('should return 404 when MULTI_DOMAIN is not configured', async () => {
      // Get the mocked appConfig
      const appConfig = require('../config/app');
      const originalMultiDomain = appConfig.MULTI_DOMAIN;
      (appConfig as any).MULTI_DOMAIN = undefined;

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkMulti(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'MULTI_DOMAIN is not configured',
        })
      );

      // Restore original value
      (appConfig as any).MULTI_DOMAIN = originalMultiDomain;
    });
  });

  describe('checkApp', () => {
    it('should return 200 when APP_URL is up', async () => {
      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkApp(req, res, jest.fn());

      expect(http.get).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'localhost:3000',
          status: 'up',
          statusCode: 200,
        })
      );
    });

    it('should return 503 when APP_URL is down', async () => {
      (http.get as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkApp(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'localhost:3000',
          status: 'down',
          error: 'ECONNREFUSED',
        })
      );
    });

    it('should handle HTTPS APP_URL', async () => {
      // Test that checkDomainHealth handles https protocol correctly
      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await checkDomainHealth('example.com', 'https');

      expect(http.get).toHaveBeenCalledWith('https://example.com', expect.any(Object));
      expect(result).toMatchObject({
        domain: 'example.com',
        status: 'up',
        statusCode: 200,
      });
    });

    it('should return 400 when APP_URL is invalid', async () => {
      // Temporarily set APP_URL to invalid value
      const appConfig = require('../config/app');
      const originalAppUrl = appConfig.APP_URL;
      (appConfig as any).APP_URL = 'not-a-valid-url';

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkApp(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid APP_URL configuration',
        })
      );

      // Restore original value
      (appConfig as any).APP_URL = originalAppUrl;
    });
  });

  describe('checkAll', () => {
    it('should return 200 when all domains are up', async () => {
      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkAll(req, res, jest.fn());

      expect(http.get).toHaveBeenCalledTimes(3); // vidsrc, multi, app
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vidsrc: expect.objectContaining({ status: 'up' }),
          multi: expect.objectContaining({ status: 'up' }),
          app: expect.objectContaining({ status: 'up' }),
          allHealthy: true,
        })
      );
    });

    it('should return 503 when any domain is down', async () => {
      (http.get as jest.Mock)
        .mockResolvedValueOnce({ status: 200 }) // vidsrc up
        .mockRejectedValueOnce(new Error('Down')) // multi down
        .mockResolvedValueOnce({ status: 200 }); // app up

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkAll(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vidsrc: expect.objectContaining({ status: 'up' }),
          multi: expect.objectContaining({ status: 'down' }),
          app: expect.objectContaining({ status: 'up' }),
          allHealthy: false,
        })
      );
    });

    it('should handle when MULTI_DOMAIN is not configured', async () => {
      // Temporarily set MULTI_DOMAIN to undefined
      const appConfig = require('../config/app');
      const originalMultiDomain = appConfig.MULTI_DOMAIN;
      (appConfig as any).MULTI_DOMAIN = undefined;

      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkAll(req, res, jest.fn());

      expect(http.get).toHaveBeenCalledTimes(2); // Only vidsrc and app
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vidsrc: expect.any(Object),
          multi: expect.objectContaining({
            error: 'MULTI_DOMAIN is not configured',
          }),
          app: expect.any(Object),
          allHealthy: true, // Still true if multi is not configured
        })
      );

      // Restore original value
      (appConfig as any).MULTI_DOMAIN = originalMultiDomain;
    });

    it('should handle invalid APP_URL in error response', async () => {
      // Temporarily set APP_URL to invalid value
      const appConfig = require('../config/app');
      const originalAppUrl = appConfig.APP_URL;
      (appConfig as any).APP_URL = 'invalid-url';

      (http.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
      });

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkAll(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          app: expect.objectContaining({
            error: 'Invalid APP_URL configuration',
          }),
          allHealthy: false,
        })
      );

      // Restore original value
      (appConfig as any).APP_URL = originalAppUrl;
    });

    it('should return 503 when all domains are down', async () => {
      (http.get as jest.Mock).mockRejectedValue(new Error('All down'));

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthController.checkAll(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vidsrc: expect.objectContaining({ status: 'down' }),
          multi: expect.objectContaining({ status: 'down' }),
          app: expect.objectContaining({ status: 'down' }),
          allHealthy: false,
        })
      );
    });
  });
});
