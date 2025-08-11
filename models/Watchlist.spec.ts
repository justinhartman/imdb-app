import { describe, expect, it, jest } from '@jest/globals';
import Watchlist, { IWatchlistItem } from './Watchlist';
import mongoose from 'mongoose';

describe('Watchlist model methods', () => {
  it('isInWatchlist checks presence', async () => {
    const w = new Watchlist({ userId: new mongoose.Types.ObjectId(), items: [{ imdbId: '1', title: 't', poster: 'p', type: 'movie' }] });
    expect(await w.isInWatchlist('1')).toBe(true);
    expect(await w.isInWatchlist('2')).toBe(false);
  });

  it('addToWatchlist adds when missing', async () => {
    const w: any = new Watchlist({ userId: new mongoose.Types.ObjectId(), items: [] });
    w.save = jest.fn();
    await w.addToWatchlist('1', 't', 'p', 'movie');
    expect(w.items).toHaveLength(1);
    expect(w.save).toHaveBeenCalled();

    w.save.mockClear();
    await w.addToWatchlist('1', 't', 'p', 'movie');
    expect(w.items).toHaveLength(1);
    expect(w.save).not.toHaveBeenCalled();
  });

  it('deleteFromWatchlist removes existing items', async () => {
    const w: any = new Watchlist({ userId: new mongoose.Types.ObjectId(), items: [{ imdbId: '1', title: 't', poster: 'p', type: 'movie' }] });
    w.save = jest.fn();
    await w.deleteFromWatchlist('1');
    expect(w.items).toHaveLength(0);
    expect(w.save).toHaveBeenCalled();

    w.save.mockClear();
    await w.deleteFromWatchlist('2');
    expect(w.items).toHaveLength(0);
    expect(w.save).not.toHaveBeenCalled();
  });
});
