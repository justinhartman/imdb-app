import { describe, expect, it, jest } from '@jest/globals';
import appConfig from '../config/app';
import axios from 'axios';

jest.mock('axios');

describe('fetchOmdbData', () => {
  it('returns empty object when query missing', async () => {
    const helper = await import('./appHelper');
    const data = await helper.fetchOmdbData('');
    expect(data).toEqual({});
  });

  it('requests data when query provided', async () => {
    (axios.request as any).mockResolvedValue({ data: { Response: 'True' } });
    const helper = await import('./appHelper');
    const data = await helper.fetchOmdbData('tt123', false, 'movie');
    expect((axios.request as any)).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ apikey: appConfig.OMDB_API_KEY, i: 'tt123', type: 'movie' }),
      })
    );
    expect(data).toEqual({ Response: 'True' });
  });
});

describe('fetchAndUpdatePosters', () => {
  it('updates poster urls based on omdb response', async () => {
    const module = await import('./appHelper');
    const spy = jest.spyOn(module, 'fetchOmdbData');
    spy
      .mockResolvedValueOnce({ Response: 'True', Poster: 'poster.jpg' })
      .mockResolvedValueOnce({ Response: 'True', Poster: 'N/A' })
      .mockResolvedValueOnce({ Response: 'False' });

    const shows: any[] = [{ imdb_id: '1' }, { imdb_id: '2' }, { imdb_id: '3' }];
    await module.fetchAndUpdatePosters(shows);
    expect(shows[0].poster).toBe('poster.jpg');
    expect(shows[1].poster).toBe(`${appConfig.APP_URL}/images/no-binger.jpg`);
    expect(shows[2].poster).toBe(`${appConfig.APP_URL}/images/no-binger.jpg`);
    spy.mockRestore();
  });
});

describe('useAuth', () => {
  it('reflects presence of MONGO_DB_URI', async () => {
    jest.resetModules();
    jest.doMock('../config/app', () => ({ MONGO_DB_URI: 'mongo' }));
    const { useAuth } = await import('./appHelper');
    expect(useAuth).toBe(true);

    jest.resetModules();
    jest.doMock('../config/app', () => ({ MONGO_DB_URI: '' }));
    const { useAuth: noAuth } = await import('./appHelper');
    expect(noAuth).toBe(false);
  });
});
