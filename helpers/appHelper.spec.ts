import axios from 'axios';

jest.mock('axios');

jest.mock('../config/app', () => ({
  OMDB_API_KEY: 'key',
  OMDB_API_URL: 'http://omdb',
  APP_URL: 'http://app',
  MONGO_DB_URI: '',
  MONGO_DB_NAME: '',
  APP_NAME: '',
  APP_SUBTITLE: '',
  APP_DESCRIPTION: '',
  API_HOST: 'localhost',
  API_PORT: 3000,
  VIDSRC_DOMAIN: 'domain',
}));

import appConfig from '../config/app';
import * as helper from './appHelper';

describe('helpers/appHelper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetchOmdbData returns empty object when query missing', async () => {
    const result = await helper.fetchOmdbData('', true);
    expect(result).toEqual({});
    expect(axios.request).not.toHaveBeenCalled();
  });

  test('fetchOmdbData calls axios with correct options', async () => {
    (axios.request as jest.Mock).mockResolvedValue({ data: { Title: 'Test' } });
    const data = await helper.fetchOmdbData('tt123', false, 'movie');
    expect(axios.request).toHaveBeenCalledWith({
      method: 'GET',
      url: appConfig.OMDB_API_URL,
      params: {
        apikey: appConfig.OMDB_API_KEY,
        type: 'movie',
        i: 'tt123',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(data).toEqual({ Title: 'Test' });
  });

  test('fetchOmdbData supports search mode and handles missing data', async () => {
    (axios.request as jest.Mock).mockResolvedValue({});
    const data = await helper.fetchOmdbData('star', true, '');
    expect(axios.request).toHaveBeenCalledWith({
      method: 'GET',
      url: appConfig.OMDB_API_URL,
      params: { apikey: appConfig.OMDB_API_KEY, s: 'star' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(data).toEqual({});
  });

  test('fetchAndUpdatePosters updates posters and defaults', async () => {
    const shows: any[] = [{ imdb_id: '1' }, { imdb_id: '2' }, { imdb_id: '3' }];
    const spy = jest
      .spyOn(helper, 'fetchOmdbData')
      .mockResolvedValueOnce({ Response: 'True', Poster: 'p1' })
      .mockResolvedValueOnce({ Response: 'True', Poster: 'N/A' })
      .mockResolvedValueOnce({ Response: 'False' });
    await helper.fetchAndUpdatePosters(shows);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(shows[0].poster).toBe('p1');
    expect(shows[1].poster).toBe(`${appConfig.APP_URL}/images/no-binger.jpg`);
    expect(shows[2].poster).toBe(`${appConfig.APP_URL}/images/no-binger.jpg`);
  });

  test('useAuth is false when no mongo uri', () => {
    expect(helper.useAuth).toBe(false);
  });

  test('useAuth is true when mongo uri provided', () => {
    jest.resetModules();
    jest.doMock('../config/app', () => ({
      OMDB_API_KEY: 'key',
      OMDB_API_URL: 'http://omdb',
      APP_URL: 'http://app',
      MONGO_DB_URI: 'mongodb://db',
      MONGO_DB_NAME: '',
      APP_NAME: '',
      APP_SUBTITLE: '',
      APP_DESCRIPTION: '',
      API_HOST: 'localhost',
      API_PORT: 3000,
      VIDSRC_DOMAIN: 'domain',
    }));
    const mod = require('./appHelper');
    expect(mod.useAuth).toBe(true);
  });
});
