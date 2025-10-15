/**
 * @module helpers/app
 * @description Application helpers for OMDB API integration and authentication.
 *
 * This module provides utilities for interacting with the OMDB (Open Movie Database) API,
 * managing movie/show poster images, and configuring application authentication.
 * It includes functions for constructing API requests, fetching movie data,
 * updating poster URLs, and checking authentication status.
 */

import { AxiosRequestConfig } from 'axios';
import http from './httpClient';
import appConfig from '../config/app';
import History from '../models/History';
import type { EpisodeInfo, SeasonDetail, SeriesDetail } from '../types/interfaces';

/**
 * TTL for cached OMDb responses in milliseconds (5 minutes).
 */
export const CACHE_TTL_MS = 1000 * 60 * 5;

const omdbCache = new Map<string, { data: any; expires: number }>();
const seriesCache = new Map<string, { data: any; expires: number }>();

export const __clearCaches = (): void => {
  omdbCache.clear();
  seriesCache.clear();
};

const useMulti = Boolean(appConfig.MULTI_DOMAIN);

/**
 * Constructs parameters object for OMDB API requests.
 * @param query - Search term for title search or IMDB ID for specific item lookup
 * @param search - When true, performs a title search using 's' parameter. When false, looks up specific item by IMDB ID using 'i' parameter
 * @param type - Optional media type filter ('movie', 'series', 'episode'). Leave empty for all types
 * @returns {Object} Parameters object containing apikey and search/lookup parameters for OMDB API
 */
const constructOmdbParams = (query: string, search: boolean, type: string): object => {
  return {
    apikey: appConfig.OMDB_API_KEY,
    ...(type && { type: type }),
    ...(search ? { s: query } : { i: query }),
  };
};

/**
 * Fetches movie/show data from OMDB API.
 * @param query - Search term for title search or IMDB ID for specific item lookup
 * @param search - When true, performs a title search. When false, looks up by IMDB ID
 * @param type - Optional media type filter ('movie', 'series', 'episode')
 * @returns {Promise<any>} Promise resolving to OMDB API response data.
 *                        For searches: {Search: Movie[], totalResults: string, Response: string}
 *                        For ID lookups: Detailed movie object or {Response: "False", Error: string}
 * @throws Will throw an error if the API request fails
 */
const fetchOmdbData = async (
  query: string,
  search = true,
  type = ''
): Promise<any> => {
  if (!query) return {};
  const key = `${query}:${search}:${type}`;
  const now = Date.now();
  const cached = omdbCache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }
  const params = constructOmdbParams(query, search, type);
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: appConfig.OMDB_API_URL,
    params: params,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await http.request(options);
  const data = response.data || {};
  omdbCache.set(key, { data, expires: now + CACHE_TTL_MS });
  return data;
};

/**
 * Updates poster URLs for an array of shows/movies by fetching data from OMDB.
 * @param show - Array of show/movie objects, each must contain an imdb_id property
 * @returns {Promise<void>} Promise that resolves when all posters are updated
 * @description For each show/movie, fetches OMDB data and updates the poster URL.
 *              If poster isn't available or request fails, sets default 'no-binger' image.
 *              Updates are performed in parallel using Promise.all
 */
const fetchAndUpdatePosters = async (
  show: any[],
  fetchFn: typeof fetchOmdbData = fetchOmdbData
): Promise<void> => {
  const fallback = `${appConfig.APP_URL}/images/no-binger.jpg`;
  await Promise.all(
    show.map(async (x: any) => {
      const data = await fetchFn(x.imdb_id, false);
      if (data.Response === 'True' && data.Poster !== 'N/A') {
        try {
          await http.head(data.Poster);
          x.poster = data.Poster;
        } catch {
          x.poster = fallback;
        }
      } else {
        x.poster = fallback;
      }
    })
  );
};

/**
 * Retrieves detailed information for a specific season of a series.
 * Also optionally fetches neighbouring seasons for navigation.
 * @param id - IMDB ID of the series
 * @param season - Season number to retrieve
 * @returns {Promise<SeriesDetail>} Object containing total seasons and cached season details
 */
const getSeriesDetail = async (id: string, season: number): Promise<SeriesDetail> => {
  if (!id) return { totalSeasons: 0, currentSeason: { season: 0, episodes: [] } };

  const buildOptions = (s: number): AxiosRequestConfig => ({
    method: 'GET',
    url: appConfig.OMDB_API_URL,
    params: {
      apikey: appConfig.OMDB_API_KEY,
      i: id,
      Season: s,
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const fetchSeason = async (s: number) => {
    const key = `${id}:${s}`;
    const now = Date.now();
    const cached = seriesCache.get(key);
    if (cached && cached.expires > now) return cached.data;
    const response = await http.request(buildOptions(s));
    const seasonData = response.data || {};
    const episodes: EpisodeInfo[] = Array.isArray(seasonData.Episodes)
      ? seasonData.Episodes.map((ep: any) => ({
          episode: Number(ep.Episode),
          title: ep.Title !== 'N/A' ? ep.Title : undefined,
        }))
      : [];
    const data = {
      season: s,
      episodes,
      totalSeasons: Number(seasonData.totalSeasons || 0),
    };
    seriesCache.set(key, { data, expires: now + CACHE_TTL_MS });
    return data;
  };

  const current = await fetchSeason(season);
  const totalSeasons = current.totalSeasons;
  let prevSeason: SeasonDetail | undefined;
  let nextSeason: SeasonDetail | undefined;

  if (season > 1) {
    const prev = await fetchSeason(season - 1);
    prevSeason = { season: prev.season, episodes: prev.episodes };
  }

  if (season < totalSeasons) {
    const next = await fetchSeason(season + 1);
    nextSeason = { season: next.season, episodes: next.episodes };
  }

  return {
    totalSeasons,
    currentSeason: { season: current.season, episodes: current.episodes },
    ...(prevSeason && { prevSeason }),
    ...(nextSeason && { nextSeason }),
  };
};

/**
 * Builds canonical URL for a movie/series.
 * @param {string} appUrl - Base application URL
 * @param {string} id - IMDB ID of the movie/show
 * @param {string} type - Type of content ('movie' or 'series')
 * @param {string} [season] - Season number (for series)
 * @param {string} [episode] - Episode number (for series)
 * @returns {string} Canonical URL for the content
 */
const buildCanonical = (
  appUrl: string,
  id: string,
  type: string,
  season?: string,
  episode?: string
) => {
  return season && episode
    ? `${appUrl}/view/${id}/${type}/${season}/${episode}`
    : `${appUrl}/view/${id}/${type}`;
};

/**
 * Builds video source URLs for movie/series iframe embedding.
 * @param {string} id - IMDB ID of the movie/show
 * @param {'movie' | 'series'} kind - Type of content ('movie' or 'series')
 * @param {string} [season] - Season number (required for series)
 * @param {string} [episode] - Episode number (required for series)
 * @returns {Object} Object containing source URLs and current server
 */
const buildSources = (
  id: string,
  kind: 'movie' | 'series',
  season?: string,
  episode?: string
) => {
  if (kind === 'series') {
    const server1Src = `https://${appConfig.VIDSRC_DOMAIN}/embed/tv?imdb=${id}&season=${season}&episode=${episode}`;
    const server2Src = useMulti
      ? `https://${appConfig.MULTI_DOMAIN}/?video_id=${id}&s=${season}&e=${episode}`
      : '';
    const iframeSrc = useMulti ? server2Src : server1Src;
    const currentServer = useMulti ? '2' : '1';
    return {server1Src, server2Src, iframeSrc, currentServer};
  }

  const server1Src = `https://${appConfig.VIDSRC_DOMAIN}/embed/movie/${id}`;
  const server2Src = useMulti ? `https://${appConfig.MULTI_DOMAIN}/?video_id=${id}` : '';
  const iframeSrc = useMulti ? server2Src : server1Src;
  const currentServer = useMulti ? '2' : '1';
  return {server1Src, server2Src, iframeSrc, currentServer};
};

/**
 * Gets resume redirect URL for a series based on last watched episode.
 * @param {string} userId - User ID
 * @param {string} imdbId - IMDB ID of the series
 * @returns {Promise<string|null>} Redirect URL if valid progress exists, null otherwise
 */
const getResumeRedirect = async (userId: string, imdbId: string): Promise<string | null> => {
  const history = await History.findOne({userId, imdbId});
  if (!history) return null;

  const {lastSeason, lastEpisode} = history as any;
  const valid =
    Number.isInteger(lastSeason) &&
    Number.isInteger(lastEpisode) &&
    lastSeason > 0 &&
    lastEpisode > 0;

  return valid ? `/view/${imdbId}/series/${lastSeason}/${lastEpisode}` : null;
};

/**
 * Updates or creates a movie watched record.
 * @param {string} userId - User ID
 * @param {string} imdbId - IMDB ID of the movie
 * @returns {Promise<any>} The updated or created history record
 */
const upsertMovieWatched = async (userId: string, imdbId: string) => {
  return History.findOneAndUpdate(
    {userId, imdbId},
    {$set: {type: 'movie', watched: true}},
    {upsert: true, new: true}
  );
};

/**
 * Updates or creates a series progress record.
 * @param {string} userId - User ID
 * @param {string} imdbId - IMDB ID of the series
 * @param {string} season - Season number
 * @param {string} episode - Episode number
 * @returns {Promise<void>}
 */
const upsertSeriesProgress = async (
  userId: string,
  imdbId: string,
  season: string,
  episode: string
) => {
  await History.findOneAndUpdate(
    {userId, imdbId},
    {$set: {type: 'series', lastSeason: Number(season), lastEpisode: Number(episode)}},
    {upsert: true}
  );
};

/**
 * Configuration flag indicating if authentication should be enabled.
 * @type {boolean}
 * @description Determines if authentication features should be enabled in the application.
 *              True when MONGO_DB_URI is set (non-empty string), false otherwise.
 * @example
 * if (useAuth) {
 *   app.use(passport.initialize());
 *   app.use(passport.session());
 * }
 */
const useAuth = appConfig.MONGO_DB_URI !== '';

export {
  buildCanonical,
  buildSources,
  fetchAndUpdatePosters,
  fetchOmdbData,
  getResumeRedirect,
  getSeriesDetail,
  upsertMovieWatched,
  upsertSeriesProgress,
  useAuth,
};
