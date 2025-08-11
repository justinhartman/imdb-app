const makeRes = () => {
  const res: any = {};
  res.locals = { APP_URL: 'http://localhost:3000' };
  res.render = jest.fn();
  res.redirect = jest.fn();
  return res;
};

const makeReq = (body: any = {}, user: any = { id: 'user-1' }) => {
  const req: any = { body, user };
  req.flash = jest.fn();
  return req;
};

describe('controllers/watchlistController unit', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getWatchlist: when Watchlist.find returns null → flash error and redirect', async () => {
    jest.doMock('../models/Watchlist', () => ({
      __esModule: true,
      default: { find: jest.fn(async () => null) },
    }));
    const req: any = makeReq();
    const res: any = makeRes();

    const ctrl = require('./watchlistController').default;
    await ctrl.getWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith('error_msg', 'No watchlist found.');
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('getWatchlist: when Watchlist.find rejects → catch with error flash and redirect', async () => {
    jest.doMock('../models/Watchlist', () => ({
      __esModule: true,
      default: { find: jest.fn(async () => { throw new Error('db fail'); }) },
    }));
    const req: any = makeReq();
    const res: any = makeRes();

    const ctrl = require('./watchlistController').default;
    await ctrl.getWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith('error_msg', expect.stringMatching(/Failed to retrieve watchlist/));
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('addToWatchlist: success path with save resolves → flash success and redirect', async () => {
    const save = jest.fn(async () => undefined);
    jest.doMock('../models/Watchlist', () => ({
      __esModule: true,
      default: {
        findOne: jest.fn(async () => ({ items: [], save })),
      },
    }));

    const req: any = makeReq({ imdbId: 'tt1', title: 'T', poster: 'p', type: 'movie' });
    const res: any = makeRes();
    const ctrl = require('./watchlistController').default;

    await ctrl.addToWatchlist(req, res);

    expect(save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('success_msg', expect.stringMatching(/Added T to watchlist/));
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('deleteFromWatchlist: item missing → error flash and redirect', async () => {
    const save = jest.fn(async () => undefined);
    jest.doMock('../models/Watchlist', () => ({
      __esModule: true,
      default: {
        findOne: jest.fn(async () => ({ items: [{ imdbId: 'tt2' }], save })),
      },
    }));

    const req: any = makeReq({ imdbId: 'tt999' });
    const res: any = makeRes();
    const ctrl = require('./watchlistController').default;

    await ctrl.deleteFromWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith('error_msg', 'Could not find item in your watchlist.');
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });
});
