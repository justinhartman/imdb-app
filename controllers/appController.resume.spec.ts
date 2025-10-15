jest.mock('../helpers/appHelper', () => {
  const actual = jest.requireActual('../helpers/appHelper');
  return {
    ...actual,
    fetchOmdbData: jest.fn(async () => ({})),
    getSeriesDetail: jest.fn(async () => ({ totalSeasons: 1, currentSeason: { season: 1, episodes: [] } })),
    getResumeRedirect: jest.fn(async () => '/view/tt/series/5/11'),
    upsertSeriesProgress: jest.fn(),
  };
});

jest.mock('../models/History', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import appController from './appController';
import { getResumeRedirect, upsertSeriesProgress } from '../helpers/appHelper';
import History from '../models/History';

describe('appController getView resume redirect', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to resume location when available', async () => {
    const req: any = { params: { q: '', id: 'tt', type: 'series' }, user: { id: 'user-1' } };
    const res: any = { locals: { APP_URL: 'http://app' }, render: jest.fn(), redirect: jest.fn() };

    (getResumeRedirect as jest.Mock).mockResolvedValue('/view/tt/series/5/11');

    await appController.getView(req, res, jest.fn());

    expect(res.redirect).toHaveBeenCalledWith('/view/tt/series/5/11');
    expect(upsertSeriesProgress).not.toHaveBeenCalled();
    expect(History.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
