import http from './httpClient';

jest.mock('./httpClient', () => ({
  __esModule: true,
  default: { request: jest.fn() },
}));

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
    expect(http.request).not.toHaveBeenCalled();
  });

  test('fetchOmdbData calls http client with correct options', async () => {
    (http.request as jest.Mock).mockResolvedValue({ data: { Title: 'Test' } });
    const data = await helper.fetchOmdbData('tt123', false, 'movie');
    expect(http.request).toHaveBeenCalledWith({
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
    (http.request as jest.Mock).mockResolvedValue({});
    const data = await helper.fetchOmdbData('star', true, '');
    expect(http.request).toHaveBeenCalledWith({
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

  test('getSeriesDetail retrieves seasons and episodes', async () => {
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E1' }] } })
      .mockResolvedValueOnce({ data: { Episodes: [{ Episode: '1', Title: 'E2' }, { Episode: '2', Title: 'E3' }] } });
    const detail = await helper.getSeriesDetail('tt1');
    expect(http.request).toHaveBeenCalledTimes(2);
    expect(detail.totalSeasons).toBe(2);
    expect(detail.totalEpisodes).toBe(3);
    expect(detail.seasons[1].episodes[1].title).toBe('E3');
  });

  test('getSeriesDetail handles missing titles and episode arrays', async () => {
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'N/A' }] } })
      .mockResolvedValueOnce({ data: { Episodes: 'N/A' } });
    const detail = await helper.getSeriesDetail('tt2');
    expect(detail.seasons[0].episodes[0].title).toBeUndefined();
    expect(detail.seasons[1].episodes).toEqual([]);
  });

  test('getSeriesDetail defaults when totalSeasons missing', async () => {
    (http.request as jest.Mock).mockResolvedValueOnce({ data: {} });
    const detail = await helper.getSeriesDetail('tt3');
    expect(detail.totalSeasons).toBe(0);
    expect(detail.seasons).toEqual([]);
  });

  test('getSeriesDetail returns empty when id missing', async () => {
    const detail = await helper.getSeriesDetail('');
    expect(detail).toEqual({ totalSeasons: 0, totalEpisodes: 0, seasons: [] });
    expect(http.request).not.toHaveBeenCalled();
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
