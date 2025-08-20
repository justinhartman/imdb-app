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
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getWatchlist: when Watchlist.find returns null → flash error and redirect', async () => {
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: { find: jest.fn(async () => null) },
      }));
      ctrl = require('./watchlistController').default;
    });
    const req: any = makeReq();
    const res: any = makeRes();

    await ctrl.getWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith('error_msg', 'No watchlist found.');
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('getWatchlist: renders watchlist when data exists', async () => {
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: { find: jest.fn(async () => [{ imdbId: 'tt1' }]) },
      }));
      ctrl = require('./watchlistController').default;
    });
    const req: any = makeReq();
    const res: any = makeRes();

    await ctrl.getWatchlist(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'watchlist',
      expect.objectContaining({
        watchlist: [{ imdbId: 'tt1' }],
        user: req.user,
      })
    );
  });

  test('getWatchlist: when Watchlist.find rejects → catch with error flash and redirect', async () => {
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: { find: jest.fn(async () => { throw new Error('db fail'); }) },
      }));
      ctrl = require('./watchlistController').default;
    });
    const req: any = makeReq();
    const res: any = makeRes();

    await ctrl.getWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith('error_msg', expect.stringMatching(/Failed to retrieve watchlist/));
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('addToWatchlist: success path with save resolves → flash success and redirect', async () => {
    const save = jest.fn(async () => undefined);
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: {
          findOne: jest.fn(async () => ({ items: [], save })),
        },
      }));
      ctrl = require('./watchlistController').default;
    });

    const req: any = makeReq({ imdbId: 'tt1', title: 'T', poster: 'p', type: 'movie' });
    const res: any = makeRes();

    await ctrl.addToWatchlist(req, res);

    expect(save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('success_msg', expect.stringMatching(/Added T to watchlist/));
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('addToWatchlist: creates new watchlist when none exists', async () => {
    const save = jest.fn(async () => undefined);
    const WatchlistMock: any = function (this: any, obj: any) {
      Object.assign(this, obj);
      this.save = save;
      this.items = [];
    };
    WatchlistMock.findOne = jest.fn(async () => null);

    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: WatchlistMock,
      }));
      ctrl = require('./watchlistController').default;
    });

    const req: any = makeReq({ imdbId: 'tt1', title: 'T', poster: 'p', type: 'movie' });
    const res: any = makeRes();

    await ctrl.addToWatchlist(req, res);

    expect(WatchlistMock.findOne).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith(
      'success_msg',
      expect.stringMatching(/Added T to watchlist/)
    );
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('addToWatchlist: model throws → catch path', async () => {
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: {
          findOne: jest.fn(async () => { throw new Error('add fail'); }),
        },
      }));
      ctrl = require('./watchlistController').default;
    });
    const req: any = makeReq({ imdbId: 'tt1', title: 'T', poster: 'p', type: 'movie' });
    const res: any = makeRes();

    await ctrl.addToWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith(
      'error_msg',
      expect.stringMatching(/Failed to add to watchlist/)
    );
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('deleteFromWatchlist: item missing → error flash and redirect', async () => {
    const save = jest.fn(async () => undefined);
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: {
          findOne: jest.fn(async () => ({ items: [{ imdbId: 'tt2' }], save })),
        },
      }));
      ctrl = require('./watchlistController').default;
    });

    const req: any = makeReq({ imdbId: 'tt999' });
    const res: any = makeRes();

    await ctrl.deleteFromWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith('error_msg', 'Could not find item in your watchlist.');
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('deleteFromWatchlist: success path removes item', async () => {
    const save = jest.fn(async () => undefined);
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: {
          findOne: jest.fn(async () => ({ items: [{ imdbId: 'tt1' }], save })),
        },
      }));
      ctrl = require('./watchlistController').default;
    });

    const req: any = makeReq({ imdbId: 'tt1' });
    const res: any = makeRes();

    await ctrl.deleteFromWatchlist(req, res);

    expect(save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith(
      'success_msg',
      'Removed item from your watchlist.'
    );
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });

  test('deleteFromWatchlist: model throws → catch path', async () => {
    let ctrl: any;
    jest.isolateModules(() => {
      jest.doMock('../models/Watchlist', () => ({
        __esModule: true,
        default: {
          findOne: jest.fn(async () => { throw new Error('del fail'); }),
        },
      }));
      ctrl = require('./watchlistController').default;
    });

    const req: any = makeReq({ imdbId: 'tt1' });
    const res: any = makeRes();

    await ctrl.deleteFromWatchlist(req, res);

    expect(req.flash).toHaveBeenCalledWith(
      'error_msg',
      expect.stringMatching(/Failed to remove/)
    );
    expect(res.redirect).toHaveBeenCalledWith('/watchlist');
  });
});
