import axios from 'axios';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

import appConfig from '../config/app';
import { fetchOmdbData, fetchAndUpdatePosters } from '../helpers/appHelper';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * @namespace appController
 * @description A controller object containing methods for handling web application routes such as the home page,
 *              view page, and search functionality.
 *
 * @property {function} getHome Handles rendering of the home page, displaying the latest movies and TV shows.
 * @property {function} getView Handles rendering of a specific content view page, either for movies or TV series episodes.
 * @property {function} getSearch Handles rendering of search results based on user queries and content type.
 */
const appController = {
  /**
   * Handles the home route to retrieve and render the latest movies and TV shows.
   * Fetches and updates posters for both movies and TV series from an external API.
   * Renders the data along with query parameters and user-specific information.
   *
   * @function getHome
   * @param {AuthRequest} req - The HTTP request object, containing query parameters and user authentication.
   * @param {Response} res - The HTTP response object used to render the home page and pass data to the client.
   * @throws Will throw an error if an issue occurs during API requests or rendering.
   */
  getHome: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = (req.query.q as string) || '';
    const type = (req.query.type as string) || 'movie';
    const canonical = res.locals.APP_URL;

    const axiosMovieResponse = await axios.get(
      `https://${appConfig.VIDSRC_DOMAIN}/movies/latest/page-1.json`
    );
    let newMovies = axiosMovieResponse.data.result || [];
    await fetchAndUpdatePosters(newMovies);

    const axiosSeriesResponse = await axios.get(
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
    let type = req.params.type;
    let t = 'movie';

    if (type === 'series') {
      const season = req.params.season || '1';
      const episode = req.params.episode || '1';
      const iframeSrc = `https://${appConfig.VIDSRC_DOMAIN}/embed/tv?imdb=${id}&season=${season}&episode=${episode}`;
      const canonical = `${res.locals.APP_URL}/view/${id}/${type}/${season}/${episode}`;
      const data = await fetchOmdbData(id, false);
      return res.render('view', {
        data,
        iframeSrc,
        query,
        id,
        type,
        season,
        episode,
        canonical,
        user: req.user,
      });
    }

    const iframeSrc = `https://${appConfig.VIDSRC_DOMAIN}/embed/${t}/${id}`;
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

