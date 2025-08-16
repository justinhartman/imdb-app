/**
 * @module controllers/appController
 * @description Application controller module handling main application routes and views.
 */

import asyncHandler from 'express-async-handler';
import { Response } from 'express';

import appConfig from '../config/app';
import { fetchOmdbData, fetchAndUpdatePosters, getSeriesDetail } from '../helpers/appHelper';
import http from '../helpers/httpClient';
import History from '../models/History';
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

    const axiosMovieResponse = await http.get(
      `https://${appConfig.VIDSRC_DOMAIN}/movies/latest/page-1.json`
    );
    let newMovies = axiosMovieResponse.data.result || [];
    await fetchAndUpdatePosters(newMovies);

    const axiosSeriesResponse = await http.get(
      `https://${appConfig.VIDSRC_DOMAIN}/tvshows/latest/page-1.json`
    );

    let newSeries = axiosSeriesResponse.data.result || [];
    await fetchAndUpdatePosters(newSeries);

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
    const type = req.params.type;

    if (type === 'series') {
      let season = req.params.season;
      let episode = req.params.episode;

      if ((!season || !episode) && req.user) {
        const history = await History.findOne({
          userId: req.user.id,
          imdbId: id,
        });
        if (history) {
          const { lastSeason, lastEpisode } = history as any;
          if (
            Number.isInteger(lastSeason) &&
            Number.isInteger(lastEpisode) &&
            lastSeason > 0 &&
            lastEpisode > 0
          ) {
            return res.redirect(`/view/${id}/series/${lastSeason}/${lastEpisode}`);
          }
        }
      }

      season = season || '1';
      episode = episode || '1';

      if (req.user) {
        await History.findOneAndUpdate(
          { userId: req.user.id, imdbId: id },
          { $set: { type: 'series', lastSeason: Number(season), lastEpisode: Number(episode) } },
          { upsert: true }
        );
      }

      const embedUrl = `https://${appConfig.VIDSRC_DOMAIN}/embed/tv?imdb=${id}&season=${season}&episode=${episode}`;
      const iframeSrc = `/proxy?url=${encodeURIComponent(embedUrl)}`;
      const canonical = `${res.locals.APP_URL}/view/${id}/${type}/${season}/${episode}`;
      const data = await fetchOmdbData(id, false);
      const seriesDetail = await getSeriesDetail(id);
      return res.render('view', {
        data,
        iframeSrc,
        query,
        id,
        type,
        season,
        episode,
        seriesDetail,
        canonical,
        user: req.user,
      });
    }

    let watched = false;
    if (req.user) {
      const history = await History.findOneAndUpdate(
        { userId: req.user.id, imdbId: id },
        { $set: { type: 'movie', watched: true } },
        { upsert: true, new: true }
      );
      watched = history?.watched || false;
    }

    const embedUrl = `https://${appConfig.VIDSRC_DOMAIN}/embed/movie/${id}`;
    const iframeSrc = `/proxy?url=${encodeURIComponent(embedUrl)}`;
    const canonical = `${res.locals.APP_URL}/view/${id}/${type}`;
    const data = await fetchOmdbData(id, false);
    res.render('view', {
      data,
      iframeSrc,
      query,
      id,
      type,
      canonical,
      user: req.user,
      watched,
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
