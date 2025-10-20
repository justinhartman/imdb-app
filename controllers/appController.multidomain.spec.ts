import { fetchOmdbData, getSeriesDetail } from '../helpers/appHelper';
import History from '../models/History';

jest.mock('../helpers/appHelper', () => {
  const actual = jest.requireActual('../helpers/appHelper');
  return {
    ...actual,
    fetchOmdbData: jest.fn(),
    getSeriesDetail: jest.fn(),
  };
});

jest.mock('../models/History', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
  },
}));

describe('controllers/appController with MULTI_DOMAIN', () => {
  let appController: any;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../config/app', () => ({
      VIDSRC_DOMAIN: 'domain',
      MULTI_DOMAIN: 'multi',
      APP_URL: 'http://app',
      APP_NAME: 'name',
      APP_SUBTITLE: '',
      APP_DESCRIPTION: '',
    }));
    appController = require('./appController').default;
    (getSeriesDetail as jest.Mock).mockResolvedValue({
      totalSeasons: 1,
      seasons: [{ season: 1, episodes: [{ episode: 1 }] }],
    });
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getView defaults to vidsrc for series when no preference set', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'series', season: '1', episode: '1' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        iframeSrc: 'https://domain/embed/tv?imdb=tt&season=1&episode=1',
        server1Src: 'https://domain/embed/tv?imdb=tt&season=1&episode=1',
        server2Src: 'https://multi/?video_id=tt&s=1&e=1',
        currentServer: '1',
        serverPreferenceKey: 'preferredServer',
      })
    );
  });

  test('getView defaults to vidsrc for movie when no preference set', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockResolvedValue({ watched: false });
    const req: any = { params: { q: '', id: 'tt', type: 'movie' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        iframeSrc: 'https://domain/embed/movie/tt',
        server1Src: 'https://domain/embed/movie/tt',
        server2Src: 'https://multi/?video_id=tt',
        currentServer: '1',
        serverPreferenceKey: 'preferredServer',
      })
    );
  });

  test('getView honours preferred server cookie', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockResolvedValue({ watched: false });
    const req: any = {
      params: { q: '', id: 'tt', type: 'movie' },
      user: { id: 'u1' },
      headers: { cookie: 'preferredServer=1' },
    };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        currentServer: '1',
        iframeSrc: 'https://domain/embed/movie/tt',
        serverPreferenceKey: 'preferredServer',
      })
    );
  });

  test('getView parses cookie with additional entries', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockResolvedValue({ watched: false });
    const req: any = {
      params: { q: '', id: 'tt', type: 'movie' },
      user: { id: 'u1' },
      headers: { cookie: 'foo=bar; preferredServer=2' },
    };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        currentServer: '2',
        iframeSrc: 'https://multi/?video_id=tt',
        serverPreferenceKey: 'preferredServer',
      })
    );
  });
});
