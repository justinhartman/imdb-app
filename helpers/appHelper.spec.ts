import http from './httpClient';

jest.mock('./httpClient', () => ({
  __esModule: true,
  default: { request: jest.fn(), head: jest.fn() },
}));

const mockAppConfig = {
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
};

jest.mock('../config/app', () => mockAppConfig);

import appConfig from '../config/app';
import * as helper from './appHelper';

describe('helpers/appHelper', () => {
  beforeEach(() => {
    helper.__clearCaches();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  test('fetchOmdbData caches results and expires', async () => {
    jest.useFakeTimers();
    (http.request as jest.Mock).mockResolvedValue({ data: { Title: 'Test' } });
    await helper.fetchOmdbData('tt123', false, 'movie');
    await helper.fetchOmdbData('tt123', false, 'movie');
    expect(http.request).toHaveBeenCalledTimes(1);
    jest.setSystemTime(Date.now() + helper.CACHE_TTL_MS + 1);
    (http.request as jest.Mock).mockResolvedValue({ data: { Title: 'Test2' } });
    await helper.fetchOmdbData('tt123', false, 'movie');
    expect(http.request).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('fetchAndUpdatePosters validates poster availability', async () => {
    const shows: any[] = [
      { imdb_id: '1' },
      { imdb_id: '2' },
      { imdb_id: '3' },
      { imdb_id: '4' },
    ];
    const spy = jest
      .spyOn(helper, 'fetchOmdbData')
      .mockResolvedValueOnce({ Response: 'True', Poster: 'p1' })
      .mockResolvedValueOnce({ Response: 'True', Poster: 'p2' })
      .mockResolvedValueOnce({ Response: 'True', Poster: 'N/A' })
      .mockResolvedValueOnce({ Response: 'False' });
    (http.head as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('404'));

    await helper.fetchAndUpdatePosters(shows);
    expect(spy).toHaveBeenCalledTimes(4);
    expect(http.head).toHaveBeenCalledTimes(2);
    expect(http.head).toHaveBeenNthCalledWith(1, 'p1');
    expect(http.head).toHaveBeenNthCalledWith(2, 'p2');
    const fallback = `${appConfig.APP_URL}/images/no-binger.jpg`;
    expect(shows[0].poster).toBe('p1');
    expect(shows[1].poster).toBe(fallback);
    expect(shows[2].poster).toBe(fallback);
    expect(shows[3].poster).toBe(fallback);
  });

  test('getSeriesDetail retrieves seasons and episodes', async () => {
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E1' }] } })
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E2' }, { Episode: '2', Title: 'E3' }] } });
    const detail = await helper.getSeriesDetail('tt1', 1);
    expect(http.request).toHaveBeenCalledTimes(2);
    expect(detail.totalSeasons).toBe(2);
    expect(detail.currentSeason.episodes[0].title).toBe('E1');
    expect(detail.nextSeason?.episodes[1].title).toBe('E3');
  });

  test('getSeriesDetail handles missing titles and episode arrays', async () => {
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'N/A' }] } })
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: 'N/A' } });
    const detail = await helper.getSeriesDetail('tt2', 1);
    expect(detail.currentSeason.episodes[0].title).toBeUndefined();
    expect(detail.nextSeason?.episodes).toEqual([]);
  });

  test('getSeriesDetail defaults when totalSeasons missing', async () => {
    (http.request as jest.Mock).mockResolvedValueOnce({ data: {} });
    const detail = await helper.getSeriesDetail('tt3', 1);
    expect(detail.totalSeasons).toBe(0);
    expect(detail.currentSeason.episodes).toEqual([]);
  });

  test('getSeriesDetail returns empty when id missing', async () => {
    const detail = await helper.getSeriesDetail('', 1);
    expect(detail).toEqual({ totalSeasons: 0, currentSeason: { season: 0, episodes: [] } });
    expect(http.request).not.toHaveBeenCalled();
  });

  test('getSeriesDetail caches seasons and expires', async () => {
    jest.useFakeTimers();
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E1' }] } })
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E2' }] } });
    await helper.getSeriesDetail('tt1', 1);
    await helper.getSeriesDetail('tt1', 1);
    expect(http.request).toHaveBeenCalledTimes(2);
    jest.setSystemTime(Date.now() + helper.CACHE_TTL_MS + 1);
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E1' }] } })
      .mockResolvedValueOnce({ data: { totalSeasons: '2', Episodes: [{ Episode: '1', Title: 'E2' }] } });
    await helper.getSeriesDetail('tt1', 1);
    expect(http.request).toHaveBeenCalledTimes(4);
    jest.useRealTimers();
  });

  test('getSeriesDetail caches neighbour seasons', async () => {
    (http.request as jest.Mock)
      .mockResolvedValueOnce({ data: { totalSeasons: '3', Episodes: [{ Episode: '1', Title: 'A' }] } })
      .mockResolvedValueOnce({ data: { totalSeasons: '3', Episodes: [{ Episode: '1', Title: 'B' }] } })
      .mockResolvedValueOnce({ data: { totalSeasons: '3', Episodes: [{ Episode: '1', Title: 'C' }] } });
    await helper.getSeriesDetail('tt1', 1);
    await helper.getSeriesDetail('tt1', 2);
    expect(http.request).toHaveBeenCalledTimes(3);
  });

  test('useAuth is false when no mongo uri', () => {
    expect(helper.useAuth).toBe(false);
  });

  test('useAuth is true when mongo uri provided', () => {
    jest.isolateModules(() => {
      mockAppConfig.MONGO_DB_URI = 'mongodb://db';
      const mod = require('./appHelper');
      expect(mod.useAuth).toBe(true);
    });
    mockAppConfig.MONGO_DB_URI = '';
  });
});
