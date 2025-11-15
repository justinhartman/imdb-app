/**
 * @module controllers/healthController
 * @description Health check controller module for testing domain availability and service status.
 */

import asyncHandler from 'express-async-handler';
import { Response } from 'express';

import appConfig from '../config/app';
import http from '../helpers/httpClient';
import type { AuthRequest } from '../types/interfaces';

/**
 * Interface for domain health check response
 */
interface DomainHealthResponse {
  domain: string;
  status: 'up' | 'down';
  statusCode?: number;
  error?: string;
  checkedAt: string;
}

/**
 * Checks if a domain is accessible by making an HTTP request.
 *
 * @param {string} domain - The domain to check
 * @param {string} protocol - The protocol to use (http or https)
 * @returns {Promise<DomainHealthResponse>} Health status of the domain
 */
export const checkDomainHealth = async (
  domain: string,
  protocol: 'http' | 'https' = 'https'
): Promise<DomainHealthResponse> => {
  const url = `${protocol}://${domain}`;
  const checkedAt = new Date().toISOString();

  try {
    const response = await http.get(url, {
      timeout: 5000,
      validateStatus: (status: number) => status < 500, // Accept any status < 500 as "up"
    } as any);

    return {
      domain,
      status: 'up',
      statusCode: response.status,
      checkedAt,
    };
  } catch (error: any) {
    return {
      domain,
      status: 'down',
      error: error.message || 'Unknown error',
      checkedAt,
    };
  }
};

/**
 * @namespace healthController
 * @description Controller object containing methods for health check endpoints.
 *
 * @property {function} checkVidsrc - Check VIDSRC_DOMAIN health
 * @property {function} checkMulti - Check MULTI_DOMAIN health
 * @property {function} checkApp - Check APP_URL health
 * @property {function} checkAll - Check all configured domains
 */
const healthController = {
  /**
   * Checks the health of the VIDSRC_DOMAIN.
   *
   * @function checkVidsrc
   * @async
   * @param {AuthRequest} _req - The HTTP request object (unused)
   * @param {Response} res - The HTTP response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /health/vidsrc
   * // Response: { "domain": "vidsrcme.su", "status": "up", "statusCode": 200, "checkedAt": "2025-01-15T10:30:00.000Z" }
   */
  checkVidsrc: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const domain = appConfig.VIDSRC_DOMAIN;
    const result = await checkDomainHealth(domain, 'https');

    const statusCode = result.status === 'up' ? 200 : 503;
    res.status(statusCode).json(result);
  }),

  /**
   * Checks the health of the MULTI_DOMAIN if configured.
   *
   * @function checkMulti
   * @async
   * @param {AuthRequest} _req - The HTTP request object (unused)
   * @param {Response} res - The HTTP response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /health/multi
   * // Response: { "domain": "multiembed.mov", "status": "up", "statusCode": 200, "checkedAt": "2025-01-15T10:30:00.000Z" }
   */
  checkMulti: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const domain = appConfig.MULTI_DOMAIN;

    if (!domain) {
      res.status(404).json({
        error: 'MULTI_DOMAIN is not configured',
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    const result = await checkDomainHealth(domain, 'https');

    const statusCode = result.status === 'up' ? 200 : 503;
    res.status(statusCode).json(result);
  }),

  /**
   * Checks the health of the APP_URL.
   *
   * @function checkApp
   * @async
   * @param {AuthRequest} _req - The HTTP request object (unused)
   * @param {Response} res - The HTTP response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /health/app
   * // Response: { "domain": "http://localhost:3000", "status": "up", "statusCode": 200, "checkedAt": "2025-01-15T10:30:00.000Z" }
   */
  checkApp: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const appUrl = appConfig.APP_URL;
    const checkedAt = new Date().toISOString();

    // Extract domain from URL
    let domain: string;
    let protocol: 'http' | 'https';

    try {
      const urlObj = new URL(appUrl);
      domain = urlObj.host;
      protocol = urlObj.protocol.replace(':', '') as 'http' | 'https';
    } catch (error) {
      res.status(400).json({
        error: 'Invalid APP_URL configuration',
        checkedAt,
      });
      return;
    }

    const result = await checkDomainHealth(domain, protocol);

    const statusCode = result.status === 'up' ? 200 : 503;
    res.status(statusCode).json(result);
  }),

  /**
   * Checks the health of all configured domains.
   *
   * @function checkAll
   * @async
   * @param {AuthRequest} _req - The HTTP request object (unused)
   * @param {Response} res - The HTTP response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /health/all
   * // Response: {
   * //   "vidsrc": { "domain": "vidsrcme.su", "status": "up", "statusCode": 200, "checkedAt": "..." },
   * //   "multi": { "domain": "multiembed.mov", "status": "up", "statusCode": 200, "checkedAt": "..." },
   * //   "app": { "domain": "localhost:3000", "status": "up", "statusCode": 200, "checkedAt": "..." },
   * //   "allHealthy": true
   * // }
   */
  checkAll: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const checkedAt = new Date().toISOString();

    // Check VIDSRC_DOMAIN
    const vidsrcResult = await checkDomainHealth(appConfig.VIDSRC_DOMAIN, 'https');

    // Check MULTI_DOMAIN if configured
    let multiResult: DomainHealthResponse | { error: string; checkedAt: string } | null = null;
    if (appConfig.MULTI_DOMAIN) {
      multiResult = await checkDomainHealth(appConfig.MULTI_DOMAIN, 'https');
    } else {
      multiResult = {
        error: 'MULTI_DOMAIN is not configured',
        checkedAt,
      };
    }

    // Check APP_URL
    let appResult: DomainHealthResponse | { error: string; checkedAt: string };
    try {
      const urlObj = new URL(appConfig.APP_URL);
      const domain = urlObj.host;
      const protocol = urlObj.protocol.replace(':', '') as 'http' | 'https';
      appResult = await checkDomainHealth(domain, protocol);
    } catch (error) {
      appResult = {
        error: 'Invalid APP_URL configuration',
        checkedAt,
      };
    }

    // Determine if all are healthy
    const allHealthy =
      vidsrcResult.status === 'up' &&
      (multiResult && 'status' in multiResult ? multiResult.status === 'up' : true) &&
      ('status' in appResult ? appResult.status === 'up' : false);

    const response = {
      vidsrc: vidsrcResult,
      multi: multiResult,
      app: appResult,
      allHealthy,
      checkedAt,
    };

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  }),
};

export default healthController;
