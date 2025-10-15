jest.mock('../models/Watchlist', () => {
  const ctor: any = function (this: any, payload: any) {
    Object.assign(this, payload);
    this.save = jest.fn(async () => undefined);
    if (!this.items) this.items = [];
  };
  ctor.findOne = jest.fn(async () => null);
  ctor.find = jest.fn(async () => []);
  return {
    __esModule: true,
    default: ctor,
  };
});

import watchlistController from './watchlistController';
import Watchlist from '../models/Watchlist';

const makeReq = (body: any = {}, user: any = { id: 'user-1' }) => {
  const req: any = { body, user, flash: jest.fn() };
  return req;
};

const makeRes = () => {
  const res: any = { locals: { APP_URL: 'http://app' }, redirect: jest.fn(), render: jest.fn() };
  return res;
};

describe('watchlistController branch coverage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('addToWatchlist creates new watchlist when missing', async () => {
    const req = makeReq({ imdbId: 'tt1', title: 'Title', poster: 'p', type: 'movie' });
    const res = makeRes();

    await watchlistController.addToWatchlist(req, res, jest.fn());

    expect((Watchlist as any).findOne).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('success_msg', expect.stringMatching(/Added Title/));
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });
});
