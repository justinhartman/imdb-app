import { getLatest, setLatest, invalidateLatest } from './cache';

describe('helpers/cache', () => {
  afterEach(() => invalidateLatest());

  test('stores and retrieves latest content', () => {
    const data = { movies: [1], series: [2] } as any;
    setLatest(data);
    expect(getLatest()).toEqual(data);
  });

  test('invalidateLatest clears cache', () => {
    setLatest({ movies: [1], series: [2] } as any);
    invalidateLatest();
    expect(getLatest()).toBeUndefined();
  });
});
