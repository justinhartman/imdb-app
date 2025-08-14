import History from './History';

describe('models/History', () => {
  const methods = (History as any).schema.methods;

  test('markWatched sets watched and saves', async () => {
    const doc: any = { watched: false, save: jest.fn() };
    await methods.markWatched.call(doc);
    expect(doc.watched).toBe(true);
    expect(doc.save).toHaveBeenCalled();
  });

  test('updatePosition updates season and episode and saves', async () => {
    const doc: any = { lastSeason: 1, lastEpisode: 1, save: jest.fn() };
    await methods.updatePosition.call(doc, 2, 3);
    expect(doc.lastSeason).toBe(2);
    expect(doc.lastEpisode).toBe(3);
    expect(doc.save).toHaveBeenCalled();
  });
});
