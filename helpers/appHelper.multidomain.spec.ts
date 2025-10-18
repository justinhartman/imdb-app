jest.mock('./httpClient', () => ({
  __esModule: true,
  default: { request: jest.fn(), head: jest.fn() },
}));

type AppConfig = {
  OMDB_API_KEY: string;
  OMDB_API_URL: string;
  APP_URL: string;
  MONGO_DB_URI: string;
  MONGO_DB_NAME: string;
  APP_NAME: string;
  APP_SUBTITLE: string;
  APP_DESCRIPTION: string;
  API_HOST: string;
  API_PORT: number;
  VIDSRC_DOMAIN: string;
  MULTI_DOMAIN: string;
};

const multiConfig: AppConfig = {
  OMDB_API_KEY: 'key',
  OMDB_API_URL: 'http://omdb',
  APP_URL: 'http://app',
  MONGO_DB_URI: '',
  MONGO_DB_NAME: '',
  APP_NAME: 'app',
  APP_SUBTITLE: '',
  APP_DESCRIPTION: '',
  API_HOST: 'localhost',
  API_PORT: 3000,
  VIDSRC_DOMAIN: 'domain',
  MULTI_DOMAIN: 'multi.example',
};

jest.mock('../config/app', () => multiConfig);

import { buildSources } from './appHelper';

describe('appHelper buildSources with MULTI_DOMAIN', () => {
  test('series sources prefer multi domain', () => {
    const result = buildSources('tt123', 'series', {season: '1', episode: '5'});
    expect(result.server2Src).toBe('https://multi.example/?video_id=tt123&s=1&e=5');
    expect(result.currentServer).toBe('2');
  });

  test('movie sources prefer multi domain', () => {
    const result = buildSources('tt123', 'movie');
    expect(result.server2Src).toBe('https://multi.example/?video_id=tt123');
    expect(result.currentServer).toBe('2');
  });

  test('preferred server overrides default when available', () => {
    const result = buildSources('tt123', 'series', {
      season: '1',
      episode: '5',
      preferredServer: '1',
    });
    expect(result.currentServer).toBe('1');
    expect(result.iframeSrc).toBe('https://domain/embed/tv?imdb=tt123&season=1&episode=5');
  });
});
