import { getLatest, setLatest, invalidateLatest } from './cache';

describe('helpers/cache', () => {
  afterEach(() => {
    invalidateLatest();
    jest.useRealTimers();
  });

  test('cache miss when empty', () => {
    expect(getLatest()).toBeUndefined();
  });

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

  test('cache entry expires after TTL', () => {
    jest.useFakeTimers();
    const data = { movies: [1], series: [2] } as any;
    setLatest(data);
    jest.setSystemTime(Date.now() + 60 * 60 * 24 * 1000 + 1);
    expect(getLatest()).toBeUndefined();
  });
});
