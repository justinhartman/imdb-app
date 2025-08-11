import Watchlist from './Watchlist';

describe('models/Watchlist', () => {
  const methods = (Watchlist as any).schema.methods;

  test('isInWatchlist determines presence', async () => {
    const doc: any = { items: [{ imdbId: 'a' }] };
    expect(await methods.isInWatchlist.call(doc, 'a')).toBe(true);
    expect(await methods.isInWatchlist.call(doc, 'b')).toBe(false);
  });

  test('addToWatchlist adds when missing', async () => {
    const doc: any = { items: [], save: jest.fn() };
    doc.isInWatchlist = methods.isInWatchlist.bind(doc);
    await methods.addToWatchlist.call(doc, 'id', 'Title', 'Poster', 'movie');
    expect(doc.items).toHaveLength(1);
    expect(doc.save).toHaveBeenCalled();
  });

  test('addToWatchlist skips existing', async () => {
    const doc: any = { items: [{ imdbId: 'id' }], save: jest.fn() };
    doc.isInWatchlist = methods.isInWatchlist.bind(doc);
    await methods.addToWatchlist.call(doc, 'id', 'Title', 'Poster', 'movie');
    expect(doc.items).toHaveLength(1);
    expect(doc.save).not.toHaveBeenCalled();
  });

  test('deleteFromWatchlist removes when present', async () => {
    const doc: any = { items: [{ imdbId: 'id' }, { imdbId: 'id2' }], save: jest.fn() };
    doc.isInWatchlist = methods.isInWatchlist.bind(doc);
    await methods.deleteFromWatchlist.call(doc, 'id');
    expect(doc.items).toEqual([{ imdbId: 'id2' }]);
    expect(doc.save).toHaveBeenCalled();
  });

  test('deleteFromWatchlist does nothing when absent', async () => {
    const doc: any = { items: [{ imdbId: 'id2' }], save: jest.fn() };
    doc.isInWatchlist = methods.isInWatchlist.bind(doc);
    await methods.deleteFromWatchlist.call(doc, 'id');
    expect(doc.items).toEqual([{ imdbId: 'id2' }]);
    expect(doc.save).not.toHaveBeenCalled();
  });
});
