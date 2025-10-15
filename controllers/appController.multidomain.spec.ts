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

  test('getView uses multiembed for series', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    const req: any = { params: { q: '', id: 'tt', type: 'series', season: '1', episode: '1' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        iframeSrc: 'https://multi/?video_id=tt&s=1&e=1',
        server1Src: 'https://domain/embed/tv?imdb=tt&season=1&episode=1',
        server2Src: 'https://multi/?video_id=tt&s=1&e=1',
        currentServer: '2',
      })
    );
  });

  test('getView uses multiembed for movie', async () => {
    (fetchOmdbData as jest.Mock).mockResolvedValue({});
    (History.findOneAndUpdate as jest.Mock).mockResolvedValue({ watched: false });
    const req: any = { params: { q: '', id: 'tt', type: 'movie' }, user: { id: 'u1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn() };
    await appController.getView(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({
        iframeSrc: 'https://multi/?video_id=tt',
        server1Src: 'https://domain/embed/movie/tt',
        server2Src: 'https://multi/?video_id=tt',
        currentServer: '2',
      })
    );
  });
});
