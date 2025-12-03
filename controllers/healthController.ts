/**
 * @module controllers/healthController
 * @description Controller providing health check endpoints for configured domains.
 */

import { Request, Response } from 'express';

import appConfig from '../config/app';
import httpClient from '../helpers/httpClient';

export type DomainHealthStatus = 'success' | 'error';

export interface DomainHealthResult {
  name: string;
  domain?: string;
  status: DomainHealthStatus;
  httpStatus?: number;
  message?: string;
}

const normalizeUrl = (domain: string): string => {
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
};

export const checkDomainHealth = async (
  name: string,
  domain: string | undefined
): Promise<DomainHealthResult> => {
  if (!domain) {
    return {
      name,
      status: 'error',
      message: 'Domain not configured',
    };
  }

  try {
    const response = await httpClient.get(normalizeUrl(domain), {
      maxRedirects: 0,
      /* c8 ignore next */
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 400) {
      return {
        name,
        domain,
        status: 'success',
        httpStatus: response.status,
      };
    }

    return {
      name,
      domain,
      status: 'error',
      httpStatus: response.status,
      message: `Received status code ${response.status}`,
    };
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error && error.message) {
      message = error.message;
    }

    return {
      name,
      domain,
      status: 'error',
      message,
    };
  }
};

const isHealthy = (results: DomainHealthResult[]): boolean => {
  return results.every((result) => result.status === 'success');
};

const healthController = {
  /**
   * Checks the configured embed domains and returns their reachability status.
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response containing domain health information.
  */
  async getEmbedDomains(req: Request, res: Response): Promise<Response> {
    const target = typeof req.query.target === 'string' ? req.query.target.toLowerCase() : undefined;

    // Return 400 if there is no `MULTI_DOMAIN` configured
    if (target === 'multi' && !appConfig.MULTI_DOMAIN) {
      return res.status(400).json({
        status: 'error',
        message: 'Target not configured',
        domains: [],
      });
    }

    const checks: Array<Promise<DomainHealthResult>> = [];

    if (!target || target === 'vidsrc') {
      checks.push(checkDomainHealth('VIDSRC_DOMAIN', appConfig.VIDSRC_DOMAIN));
    }

    if (!target || target === 'multi') {
      // This makes sure we make this optional as there will be scenarios where MULTI_DOMAIN isn't configured
      if (appConfig.MULTI_DOMAIN) {
        checks.push(checkDomainHealth('MULTI_DOMAIN', appConfig.MULTI_DOMAIN));
      }
    }

    if (checks.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid target',
        domains: [],
      });
    }

    const domains = await Promise.all(checks);

    const healthy = isHealthy(domains);
    return res.status(healthy ? 200 : 503).json({ domains, status: healthy ? 'success' : 'error' });
  },

  /**
   * Checks the configured application URL and returns its reachability status.
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response containing APP_URL health information.
   */
  async getAppUrl(_req: Request, res: Response): Promise<Response> {
    const domain = await checkDomainHealth('APP_URL', appConfig.APP_URL);
    const healthy = domain.status === 'success';
    return res.status(healthy ? 200 : 503).json(domain);
  },
};

export default healthController;
