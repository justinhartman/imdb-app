/**
 * @module helpers/httpClient
 * @description HTTP client module providing a configured Axios instance with retry capabilities
 * for handling transient network errors.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import http from 'node:http';
import https from 'node:https';

const httpAgent = new http.Agent({ keepAlive: false });
const httpsAgent = new https.Agent({ keepAlive: false });

/**
 * Configured Axios instance with custom settings for timeout, redirects, and connection handling.
 * @constant
 * @type {AxiosInstance}
 * @property {number} timeout - Request timeout in milliseconds (10 seconds)
 * @property {number} maxRedirects - Maximum number of redirects to follow
 * @property {http.Agent} httpAgent - HTTP agent with keep-alive disabled
 * @property {https.Agent} httpsAgent - HTTPS agent with keep-alive disabled
 */
const client: AxiosInstance = axios.create({
  timeout: 10_000,
  maxRedirects: 5,
  httpAgent,
  httpsAgent,
  transitional: { clarifyTimeoutError: true },
  headers: { Connection: 'close' },
});

/**
 * Set of error codes that are considered retryable network errors.
 * @constant
 * @type {Set<string>}
 */
const retryableCodes = new Set([
  'ECONNRESET',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EPIPE',
]);
const retryableMessages = ['socket hang up', 'Network Error'];

/**
 * Response interceptor that implements retry logic for transient network errors.
 * Implements exponential backoff with random jitter for retry delays.
 *
 * @param {AxiosError} error - The error that occurred during the request
 * @returns {Promise<any>} A promise that resolves to the retry attempt or rejects with the error
 * @throws {AxiosError} If max retries are exceeded or error is not retryable
 */
client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const cfg = error.config as any;
  if (!cfg) throw error;

  const shouldRetry =
    (error.code && retryableCodes.has(error.code)) ||
    retryableMessages.some((m) => error.message.includes(m));

  cfg.__retryCount = cfg.__retryCount || 0;
  const maxRetries = cfg.maxRetries ?? 2;

  if (shouldRetry && cfg.__retryCount < maxRetries) {
    cfg.__retryCount += 1;
    const delayMs = 300 * Math.pow(2, cfg.__retryCount - 1) + Math.floor(Math.random() * 100);
    await new Promise((r) => setTimeout(r, delayMs));
    return client(cfg);
  }

  throw error;
});

export default client;
