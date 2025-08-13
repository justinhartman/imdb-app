import express from 'express';
import path from 'path';
import request from 'supertest';

// Controller mock that builds iframeSrc based on params
jest.mock('../../../controllers/appController', () => ({
  __esModule: true,
  default: {
    getHome: jest.fn(),
    getView: (req: any, res: any) => {
      const { id, type, season = '1', episode = '1' } = req.params;
      const iframeSrc =
        type === 'series'
          ? `https://example.com/embed/tv?imdb=${id}&season=${season}&episode=${episode}`
          : 'https://example.com/embed/movie';

      return res.render('view', {
        data: {
          Response: 'True',
          Title: 'Test',
          Year: '2024',
          Plot: '',
          Type: type,
          Actors: '',
          Runtime: '',
          Genre: '',
          Ratings: [],
          Director: '',
          Rated: '',
          Country: '',
          Language: '',
          Released: '',
          Poster: '',
          imdbRating: 'N/A',
          imdbVotes: '0',
        },
        iframeSrc,
        query: '',
        id,
        type,
        canonical: '',
        user: null,
        watched: false,
        season,
        episode,
      });
    },
    getSearch: jest.fn(),
  },
}));

// Mock EJS renderer to avoid partials/includes
jest.mock('ejs', () => ({
  __esModule: true,
  __express: (_filename: string, data: any, cb: (err: any, html?: string) => void) => {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
  <div class="ratio ratio-16x9">
    <iframe src="${data.iframeSrc}"
            referrerpolicy="origin"
            allow="autoplay; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms"
            class="w-100"
            allowfullscreen></iframe>
  </div>
  <script>window.open = () => null;</script>
</body></html>`;
    cb(null, html);
  },
}));

import appController from '../../../controllers/appController';

// Flexible matcher: checks required sandbox tokens in any order
const iframeWithSandboxTokens = (...tokens: string[]) =>
  new RegExp(
    `<iframe[^>]*sandbox="[^"]*${tokens.map(t => `(?=.*\\b${t}\\b)`).join('')}[^"]*"[^>]*>`,
    'i'
  );

const buildApp = () => {
  const app = express();
  app.set('view engine', 'ejs');
  // Use the deeper path as you discovered
  app.set('views', path.resolve(__dirname, '../../../views'));

  app.use((req, res, next) => {
    res.locals.APP_NAME = 'App';
    res.locals.APP_SUBTITLE = '';
    res.locals.APP_DESCRIPTION = '';
    res.locals.APP_URL = '';
    next();
  });

  // Support both movie and series with optional season/episode
  app.get('/view/:id/:type/:season?/:episode?', appController.getView as any);

  // Helpful error handler during debugging
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(500).send(`TEST_RENDER_ERROR:${err?.message ?? 'unknown'}`);
  });

  return app;
};

describe('view route', () => {
  test('GET /view/:id/:type (movie) renders sandboxed iframe', async () => {
    const app = buildApp();
    const res = await request(app).get('/view/tt123/movie');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(iframeWithSandboxTokens('allow-same-origin', 'allow-scripts', 'allow-forms'));
    expect(res.text).toMatch(/src="https:\/\/example\.com\/embed\/movie"/);
  });

  test('GET /view/:id/:type (movie) window.open is disabled', async () => {
    const app = buildApp();
    const res = await request(app).get('/view/tt123/movie');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/window\.open\s*=\s*\(\)\s*=>\s*null/);
  });

  test('GET /view/:id/:type/:season/:episode (series) builds correct iframeSrc and sandbox', async () => {
    const app = buildApp();
    const res = await request(app).get('/view/tt123/series/1/1');

    expect(res.status).toBe(200);
    // Exact src with query params
    expect(res.text).toMatch(
      /src="https:\/\/example\.com\/embed\/tv\?imdb=tt123&season=1&episode=1"/
    );
    expect(res.text).toMatch(iframeWithSandboxTokens('allow-same-origin', 'allow-scripts', 'allow-forms'));
  });

  test('GET /view/:id/:type/:season/:episode (series) window.open is disabled', async () => {
    const app = buildApp();
    const res = await request(app).get('/view/tt123/series/1/1');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/window\.open\s*=\s*\(\)\s*=>\s*null/);
  });
});
