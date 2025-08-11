/**
 * Application helpers.
 * @module helpers/app
 */

import axios, { AxiosRequestConfig } from 'axios';
import appConfig from '../config/app';

const constructOmdbParams = (query: string, search: boolean, type: string) => {
  return {
    apikey: appConfig.OMDB_API_KEY,
    ...(type && { type: type }),
    ...(search ? { s: query } : { i: query }),
  };
};

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
  const response = await axios.request(options);
  return response.data || {};
};

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

export const useAuth = appConfig.MONGO_DB_URI !== '';

