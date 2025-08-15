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
import type { EpisodeInfo, SeasonDetail, SeriesDetail } from '../types/interfaces';

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
export const fetchOmdbData = async (
  query: string,
  search = true,
  type = ''
): Promise<any> => {
  if (!query) return {};
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
  return response.data || {};
};

/**
 * Updates poster URLs for an array of shows/movies by fetching data from OMDB.
 * @param show - Array of show/movie objects, each must contain an imdb_id property
 * @returns {Promise<void>} Promise that resolves when all posters are updated
 * @description For each show/movie, fetches OMDB data and updates the poster URL.
 *              If poster isn't available or request fails, sets default 'no-binger' image.
 *              Updates are performed in parallel using Promise.all
 */
export const fetchAndUpdatePosters = async (show: any[]): Promise<void> => {
  await Promise.all(
    show.map(async (x: any) => {
      const data = await fetchOmdbData(x.imdb_id, false);
      if (data.Response === 'True')
        x.poster =
          data.Poster !== 'N/A'
            ? data.Poster
            : `${appConfig.APP_URL}/images/no-binger.jpg`;
      else x.poster = `${appConfig.APP_URL}/images/no-binger.jpg`;
    })
  );
};

/**
 * Retrieves detailed information for a series including seasons and episodes.
 * @param id - IMDB ID of the series
 * @returns {Promise<SeriesDetail>} Object containing total seasons, total episodes and per-season breakdown
 */
export const getSeriesDetail = async (id: string): Promise<SeriesDetail> => {
  if (!id) return { totalSeasons: 0, totalEpisodes: 0, seasons: [] };

  const buildOptions = (season: number): AxiosRequestConfig => ({
    method: 'GET',
    url: appConfig.OMDB_API_URL,
    params: {
      apikey: appConfig.OMDB_API_KEY,
      i: id,
      Season: season,
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const firstResponse = await http.request(buildOptions(1));
  const totalSeasons = Number(firstResponse.data.totalSeasons || 0);

  const seasons: SeasonDetail[] = [];
  let totalEpisodes = 0;

  for (let s = 1; s <= totalSeasons; s++) {
    const seasonData = s === 1 ? firstResponse.data : (await http.request(buildOptions(s))).data;
    const episodes: EpisodeInfo[] = Array.isArray(seasonData.Episodes)
      ? seasonData.Episodes.map((ep: any) => ({
          episode: Number(ep.Episode),
          title: ep.Title !== 'N/A' ? ep.Title : undefined,
        }))
      : [];
    seasons.push({ season: s, episodes });
    totalEpisodes += episodes.length;
  }

  return { totalSeasons, totalEpisodes, seasons };
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
export const useAuth = appConfig.MONGO_DB_URI !== '';
