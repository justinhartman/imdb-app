import appController from './appController';
import axios from 'axios';
import { fetchOmdbData, fetchAndUpdatePosters } from '../helpers/appHelper';

jest.mock('axios');
jest.mock('../helpers/appHelper', () => ({
  fetchOmdbData: jest.fn(),
  fetchAndUpdatePosters: jest.fn(),
}));

jest.mock('../config/app', () => ({
  VIDSRC_DOMAIN: 'domain',
  APP_URL: 'http://app',
  APP_NAME: 'name',
  APP_SUBTITLE: '',
  APP_DESCRIPTION: '',
}));

describe('controllers/appController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getHome renders index with movies and series', async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { result: [{ imdb_id: '1' }] } })
      .mockResolvedValueOnce({ data: { result: [{ imdb_id: '2' }] } });
    (fetchAndUpdatePosters as jest.Mock).mockResolvedValue(undefined);

    const req: any = { query: {}, user: { id: 1 } };
    const res: any = { locals: { APP_URL: 'http://app', CARD_TYPE: 'card' }, render: jest.fn() };

    await appController.getHome(req, res, jest.fn());

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(fetchAndUpdatePosters).toHaveBeenCalledTimes(2);
    expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
      newMovies: [{ imdb_id: '1' }],
      newSeries: [{ imdb_id: '2' }],
      card: 'card',
      user: req.user,
    }));
  });

  test('getHome handles empty results', async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: {} });
    (fetchAndUpdatePosters as jest.Mock).mockResolvedValue(undefined);

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

  test('getView renders series view', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'series', season: '1', episode: '2' }, user: {} };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };

    await appController.getView(req, res, jest.fn());
    expect(fetchOmdbData).toHaveBeenCalledWith('tt', false);
    expect(res.render).toHaveBeenCalledWith('view', expect.objectContaining({
      season: '1',
      episode: '2',
      type: 'series',
    }));
  });

  test('getView defaults season and episode when missing', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'series' }, user: {} };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };

    await appController.getView(req, res, jest.fn());

    expect(res.render).toHaveBeenCalledWith('view', expect.objectContaining({
      season: '1',
      episode: '1',
    }));
  });

  test('getView renders movie view', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'movie' }, user: {} };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };

    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith('view', expect.objectContaining({ type: 'movie' }));
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
