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
  domain?: string
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

const healthController = {
  /**
   * Checks the configured embed domains and returns their reachability status.
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response containing domain health information.
   */
  async getEmbedDomains(_req: Request, res: Response): Promise<Response> {
    const domains = await Promise.all([
      checkDomainHealth('VIDSRC_DOMAIN', appConfig.VIDSRC_DOMAIN),
      checkDomainHealth('MULTI_DOMAIN', appConfig.MULTI_DOMAIN),
    ]);

    return res.json({ domains });
  },

  /**
   * Checks the configured application URL and returns its reachability status.
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response containing APP_URL health information.
   */
  async getAppUrl(_req: Request, res: Response): Promise<Response> {
    const domain = await checkDomainHealth('APP_URL', appConfig.APP_URL);
    return res.json(domain);
  },
};

export default healthController;
