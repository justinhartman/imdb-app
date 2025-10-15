/**
 * @module helpers/cache
 * @description In-memory caching utilities for storing latest movies and series.
 */

import NodeCache from 'node-cache';

/**
 * TTL for cache entries in seconds (24 hours).
 */
const TTL_SECONDS = 60 * 60 * 24;

/**
 * Internal NodeCache instance.
 */
const cache = new NodeCache({ stdTTL: TTL_SECONDS });

const HOME_KEY = 'latest_home';

export interface LatestContent {
  movies: any[];
  series: any[];
}

/**
 * Retrieves latest movies and series from cache.
 * @returns {LatestContent | undefined} Cached content if available.
 */
export const getLatest = (): LatestContent | undefined => {
  return cache.get<LatestContent>(HOME_KEY);
};

/**
 * Stores latest movies and series in cache.
 * @param data Latest content to cache.
 */
export const setLatest = (data: LatestContent): void => {
  cache.set(HOME_KEY, data);
};

/**
 * Manually clears the cached latest content.
 */
export const invalidateLatest = (): void => {
  cache.del(HOME_KEY);
};

export default {
  getLatest,
  setLatest,
  invalidateLatest,
};
