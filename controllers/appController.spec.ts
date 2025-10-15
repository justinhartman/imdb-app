import appController from './appController';
import http from '../helpers/httpClient';
import { fetchOmdbData, fetchAndUpdatePosters, getSeriesDetail } from '../helpers/appHelper';
import History from '../models/History';
import { getLatest, setLatest, invalidateLatest } from '../helpers/cache';

jest.mock('../helpers/httpClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('../helpers/appHelper', () => {
  const actual = jest.requireActual('../helpers/appHelper');
  return {
    ...actual,
    fetchOmdbData: jest.fn(),
    fetchAndUpdatePosters: jest.fn(),
    getSeriesDetail: jest.fn(),
  };
});

jest.mock('../helpers/cache', () => ({
  getLatest: jest.fn(),
  setLatest: jest.fn(),
  invalidateLatest: jest.fn(),
}));

jest.mock('../models/History', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../config/app', () => ({
  VIDSRC_DOMAIN: 'domain',
  MULTI_DOMAIN: undefined,
  APP_URL: 'http://app',
  APP_NAME: 'name',
  APP_SUBTITLE: '',
  APP_DESCRIPTION: '',
}));

describe('controllers/appController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSeriesDetail as jest.Mock).mockResolvedValue({
      totalSeasons: 1,
      currentSeason: { season: 1, episodes: [{ episode: 1, title: 'E1' }] },
    });
  });

  test('getHome renders index with movies and series', async () => {
    (http.get as jest.Mock)
      .mockResolvedValueOnce({ data: { result: [{ imdb_id: '1' }] } })
      .mockResolvedValueOnce({ data: { result: [{ imdb_id: '2' }] } });
    (fetchAndUpdatePosters as jest.Mock).mockResolvedValue(undefined);
    (getLatest as jest.Mock).mockReturnValue(undefined);

    const req: any = { query: {}, user: { id: 1 } };
    const res: any = { locals: { APP_URL: 'http://app', CARD_TYPE: 'card' }, render: jest.fn() };

    await appController.getHome(req, res, jest.fn());

    expect(http.get).toHaveBeenCalledTimes(2);
    expect(fetchAndUpdatePosters).toHaveBeenCalledTimes(2);
    expect(setLatest).toHaveBeenCalledWith({ movies: [{ imdb_id: '1' }], series: [{ imdb_id: '2' }] });
    expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
      newMovies: [{ imdb_id: '1' }],
      newSeries: [{ imdb_id: '2' }],
      card: 'card',
      user: req.user,
    }));
  });

  test('getHome handles empty results', async () => {
    (http.get as jest.Mock)
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: {} });
    (fetchAndUpdatePosters as jest.Mock).mockResolvedValue(undefined);
    (getLatest as jest.Mock).mockReturnValue(undefined);

    const req: any = { query: {}, user: {} };
    const res: any = {
      locals: { APP_URL: 'http://app', CARD_TYPE: 'card' },
      render: jest.fn(),
    };

    await appController.getHome(req, res, jest.fn());

    expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
      newMovies: [],
      newSeries: [],
    }));
  });

  test('getHome returns cached results when available', async () => {
    (getLatest as jest.Mock).mockReturnValue({
      movies: [{ imdb_id: 'm1' }],
      series: [{ imdb_id: 's1' }],
    });
    const req: any = { query: {}, user: {} };
    const res: any = { locals: { APP_URL: 'http://app', CARD_TYPE: 'card' }, render: jest.fn() };

    await appController.getHome(req, res, jest.fn());

    expect(http.get).not.toHaveBeenCalled();
    expect(fetchAndUpdatePosters).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
      newMovies: [{ imdb_id: 'm1' }],
      newSeries: [{ imdb_id: 's1' }],
    }));
  });

  test('clearCache invalidates cache', async () => {
    const req: any = {};
    const res: any = { json: jest.fn() };

    await appController.clearCache(req, res, jest.fn());

    expect(invalidateLatest).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ cleared: true });
  });

  test('getView renders series view', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'series', season: '1', episode: '2' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };

    await appController.getView(req, res, jest.fn());
    expect(History.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1', imdbId: 'tt' },
      { $set: { type: 'series', lastSeason: 1, lastEpisode: 2 } },
      { upsert: true }
    );
    expect(getSeriesDetail).toHaveBeenCalledWith('tt', 1);
    expect(res.render).toHaveBeenCalledWith('view', expect.objectContaining({
      season: '1',
      episode: '2',
      type: 'series',
      iframeSrc: 'https://domain/embed/tv?imdb=tt&season=1&episode=2',
      server1Src: 'https://domain/embed/tv?imdb=tt&season=1&episode=2',
      server2Src: '',
      currentServer: '1',
    }));
  });

  test('getView defaults season and episode when missing', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOne as jest.Mock).mockResolvedValue(undefined);
    const req: any = { params: { q: '', id: 'tt', type: 'series' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };

    await appController.getView(req, res, jest.fn());

    expect(res.redirect).not.toHaveBeenCalled();
    expect(History.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1', imdbId: 'tt' },
      { $set: { type: 'series', lastSeason: 1, lastEpisode: 1 } },
      { upsert: true }
    );
    expect(res.render).toHaveBeenCalledWith('view', expect.objectContaining({
      season: '1',
      episode: '1',
    }));
  });

  test('getView renders movie view', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockResolvedValue({ watched: true });
    const req: any = { params: { q: '', id: 'tt', type: 'movie' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };

    await appController.getView(req, res, jest.fn());
    expect(History.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1', imdbId: 'tt' },
      { $set: { type: 'movie', watched: true } },
      { upsert: true, new: true }
    );
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        type: 'movie',
        watched: true,
        iframeSrc: 'https://domain/embed/movie/tt',
        server1Src: 'https://domain/embed/movie/tt',
        server2Src: '',
        currentServer: '1',
      })
    );
  });

  test('getView handles missing history on movie view', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    const req: any = { params: { q: '', id: 'tt', type: 'movie' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };

    await appController.getView(req, res, jest.fn());

    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({ type: 'movie', watched: false })
    );
  });

  test('getView redirects to history position for series', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOne as jest.Mock).mockResolvedValue({ lastSeason: 5, lastEpisode: 11 });
    const req: any = { params: { q: '', id: 'tt', type: 'series' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };

    await appController.getView(req, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('/view/tt/series/5/11');
    expect(History.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('getView ignores malformed history and uses defaults', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOne as jest.Mock).mockResolvedValue({ lastSeason: 'abc', lastEpisode: null });
    const req: any = { params: { q: '', id: 'tt', type: 'series' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };

    await appController.getView(req, res, jest.fn());

    expect(res.redirect).not.toHaveBeenCalled();
    expect(History.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1', imdbId: 'tt' },
      { $set: { type: 'series', lastSeason: 1, lastEpisode: 1 } },
      { upsert: true }
    );
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({ season: '1', episode: '1' })
    );
  });

  test('getView series without user does not query history', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'series' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };

    await appController.getView(req, res, jest.fn());

    expect(History.findOne).not.toHaveBeenCalled();
    expect(History.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({ season: '1', episode: '1' })
    );
  });

  test('getView propagates errors from History.findOne', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOne as jest.Mock).mockRejectedValue(new Error('fail'));
    const req: any = { params: { q: '', id: 'tt', type: 'series' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };
    const next = jest.fn();

    await appController.getView(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getView propagates errors from History.findOneAndUpdate', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockRejectedValue(new Error('fail'));
    const req: any = { params: { q: '', id: 'tt', type: 'movie' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    const next = jest.fn();

    await appController.getView(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getView movie without user skips history', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'movie' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };

    await appController.getView(req, res, jest.fn());
    expect(History.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('getSearch redirects when query empty', async () => {
    const req: any = { query: { q: '   ' }, user: {} };
    const res: any = { locals: { APP_URL: 'http://app' }, redirect: jest.fn(), render: jest.fn() };
    await appController.getSearch(req, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('getSearch renders search results', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({ Search: [{ Title: 'A' }] });
    const req: any = { query: { q: 'test', type: 'movie' }, user: {} };
    const res: any = { locals: { APP_URL: 'http://app', CARD_TYPE: 'card' }, redirect: jest.fn(), render: jest.fn() };
    await appController.getSearch(req, res, jest.fn());
    expect(fetchOmdbData).toHaveBeenCalledWith('test', true, 'movie');
    expect(res.render).toHaveBeenCalledWith('search', expect.objectContaining({
      results: [{ Title: 'A' }],
      card: 'card',
    }));
  });
});
