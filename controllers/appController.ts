/**
 * @module controllers/appController
 * @description Application controller module handling main application routes and views.
 */

import asyncHandler from 'express-async-handler';
import { Response } from 'express';

import appConfig from '../config/app';
import {
  buildCanonical,
  buildSources,
  fetchAndUpdatePosters,
  fetchOmdbData,
  getPreferredServer,
  getResumeRedirect,
  getSeriesDetail,
  upsertSeriesProgress,
  upsertMovieWatched,
  PREFERRED_SERVER_COOKIE,
} from '../helpers/appHelper';
import { getLatest, invalidateLatest, setLatest } from '../helpers/cache';
import http from '../helpers/httpClient';
import type { AuthRequest } from '../types/interfaces';

/**
 * @namespace appController
 * @description Controller object containing methods for handling web application routes and views.
 * This controller manages the main functionality of the application including home page display,
 * content viewing, and search operations.
 *
 * @property {function} getHome - Renders home page with latest movies and TV shows
 * @property {function} getView - Renders specific content view for movies or TV episodes
 * @property {function} getSearch - Processes search queries and renders results
 *
 * @example
 * // Using getHome to render the home page
 * appController.getHome(req, res);
 *
 * // Using getView to display specific content
 * appController.getView(req, res);
 *
 * // Using getSearch to find content
 * appController.getSearch(req, res);
 */
const appController = {
  /**
   * Handles the home route to retrieve and render the latest movies and TV shows.
   *
   * @function getHome
   * @async
   * @param {AuthRequest} req - The HTTP request object with query parameters and user auth
   * @param {Response} res - The HTTP response object for rendering
   * @throws {Error} If API requests fail or rendering encounters an error
   *
   * @description
   * This function performs the following operations:
   * 1. Extracts query parameters for search and content type
   * 2. Fetches latest movies from VIDSRC API
   * 3. Fetches latest TV shows from VIDSRC API
   * 4. Updates poster images for both movies and shows
   * 5. Renders the home page with all gathered data
   *
   * @example
   * // Route handler usage
   * router.get('/', appController.getHome);
   */
  getHome: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = (req.query.q as string) || '';
    const type = (req.query.type as string) || 'movie';
    const canonical = res.locals.APP_URL;
    const cached = getLatest();
    if (cached) {
      return res.render('index', {
        newMovies: cached.movies,
        newSeries: cached.series,
        query,
        type,
        canonical,
        card: res.locals.CARD_TYPE,
        user: req.user,
      });
    }

    const [axiosMovieResponse, axiosSeriesResponse] = await Promise.all([
      http.get(`https://${appConfig.VIDSRC_DOMAIN}/movies/latest/page-1.json`),
      http.get(`https://${appConfig.VIDSRC_DOMAIN}/tvshows/latest/page-1.json`),
    ]);

    let newMovies = axiosMovieResponse.data.result || [];
    let newSeries = axiosSeriesResponse.data.result || [];

    await Promise.all([
      fetchAndUpdatePosters(newMovies),
      fetchAndUpdatePosters(newSeries),
    ]);

    setLatest({ movies: newMovies, series: newSeries });

    res.render('index', {
      newMovies,
      newSeries,
      query,
      type,
      canonical,
      card: res.locals.CARD_TYPE,
      user: req.user,
    });
  }),

  /**
   * Invalidates the cached latest movies and series.
   * Useful for deployments or scheduled cache refreshes.
   */
  clearCache: asyncHandler(async (_req: AuthRequest, res: Response) => {
    invalidateLatest();
    res.json({ cleared: true });
  }),

  /**
   * Handles the "getView" route for rendering a view page based on the provided query parameters.
   *
   * @function getView
   * @async
   * @param {AuthRequest} req - The request object, containing parameters like `q`, `id`, `type`, `season`, and `episode`.
   * @param {Response} res - The response object, used for rendering the view or sending a response.
   * @returns {void}
   *
   * This function processes the route parameters to determine the content type (movie or series). It dynamically constructs
   * the iframe source URL and the canonical URL for SEO purposes, and fetches additional data from the OMDb API. Depending on
   * the `type` parameter (series or default movie), it includes additional fields for season and episode when rendering the view.
   */
  getView: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.params.q || '';
    const id = req.params.id;
    const type = req.params.type as 'movie' | 'series';

    const preferredServer = getPreferredServer(req.headers.cookie);

    if (type === 'series') {
      let season = req.params.season;
      let episode = req.params.episode;

      if ((!season || !episode) && req.user) {
        const redirectTo = await getResumeRedirect(req.user.id, id);
        if (redirectTo) {
          return res.redirect(redirectTo);
        }
      }

      season = season || '1';
      episode = episode || '1';

      if (req.user) {
        await upsertSeriesProgress(req.user.id, id, season, episode);
      }

      const { server1Src, server2Src, iframeSrc, currentServer } = buildSources(
        id,
        'series',
        season,
        episode,
        preferredServer
      );
      const canonical = buildCanonical(res.locals.APP_URL, id, type, season, episode);
      const data = await fetchOmdbData(id, false);
      const seriesDetail = await getSeriesDetail(id, Number(season));

      return res.render('view', {
        data,
        iframeSrc,
        server1Src,
        server2Src,
        currentServer,
        query,
        id,
        type,
        season,
        episode,
        seriesDetail,
        canonical,
        user: req.user,
        preferredServerCookie: PREFERRED_SERVER_COOKIE,
      });
    }

    // movie branch
    let watched = false;
    if (req.user) {
      const history = await upsertMovieWatched(req.user.id, id);
      watched = history?.watched || false;
    }

    const { server1Src, server2Src, iframeSrc, currentServer } = buildSources(
      id,
      'movie',
      undefined,
      undefined,
      preferredServer
    );
    const canonical = buildCanonical(res.locals.APP_URL, id, type);
    const data = await fetchOmdbData(id, false);

    res.render('view', {
      data,
      iframeSrc,
      server1Src,
      server2Src,
      currentServer,
      query,
      id,
      type,
      canonical,
      user: req.user,
      watched,
      preferredServerCookie: PREFERRED_SERVER_COOKIE,
    });
  }),

  /**
   * Handles the search functionality for the application.
   * Processes the search query and type from the request, fetches search results from the OMDB API, and renders the
   * search results page.
   *
   * @function getSearch
   * @async
   * @param {AuthRequest} req - The request object, including query parameters for the search query and type.
   * @param {Response} res - The response object used to render the search page or perform a redirect.
   * @throws {Error} Propagates errors due to issues in fetching data from OMDB or rendering the response.
   */
  getSearch: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = (req.query.q as string).trim();
    const type = (req.query.type as string) || 'movie';
    const omdbSearch = await fetchOmdbData(query, true, type);
    const results = omdbSearch.Search || [];
    const canonical = `${res.locals.APP_URL}/search/?q=${query}&type=${type}`;
    if (!query) res.redirect('/');
    res.render('search', {
      query,
      results,
      type,
      canonical,
      card: res.locals.CARD_TYPE,
      user: req.user,
    });
  }),
};

export default appController;
