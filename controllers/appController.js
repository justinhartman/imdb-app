const axios = require("axios");
const asyncHandler = require('express-async-handler');

const {
  fetchOmdbData,
  fetchAndUpdatePosters
} = require('../helpers/appHelper');

/**
 * @module appController
 * @description This module contains the standard application controller functions.
 */
const appController = {
  /**
   * @function getHome
   * @memberof appController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This handles the rendering the home page with new movies and TV shows.
   * It sets the canonical URL and renders the 'index' template with the specified parameters.
   * @return {Promise<void>}
   */
  getHome: asyncHandler(async (req, res) => {
    const query = req.query.q || '';
    const type = req.query.type || 'ovie';
    const canonical = res.locals.APP_URL;
    let newMovies = [];
    let newSeries = [];

    /**
     * Fetch new movies from VidSrc.
     * You can switch to new movies instead of the default 'added' with 'https://vidsrc.to/vapi/movie/new'
     * @type {axios.AxiosResponse<any>}
     * @docs https://vidsrc.to/#api
     */
    const axiosMovieResponse = await axios.get('https://vidsrc.to/vapi/movie/add');
    newMovies = axiosMovieResponse.data.result.items || [];
    await fetchAndUpdatePosters(newMovies);

    /**
     * Fetch new TV shows from VidSrc.
     * You can switch to new movies instead of the default 'added' with 'https://vidsrc.to/vapi/tv/new'
     * @type {axios.AxiosResponse<any>}
     * @docs https://vidsrc.to/#api
     */
    const axiosSeriesResponse = await axios.get('https://vidsrc.to/vapi/tv/add');
    newSeries = axiosSeriesResponse.data.result.items || [];
    await fetchAndUpdatePosters(newSeries);

    res.render('index', { newMovies, newSeries, query, type, canonical, card: res.locals.CARD_TYPE, user: req.user });
  }),

  /**
   * @function getView
   * @memberof appController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the rendering of a movie or TV video player page.
   * It sets the canonical URL and renders the 'view' template and returns the iFrame VidSrc URL
   * along with parsed OMDB data for the template.
   * @returns {Promise<void>}
   */
  getView: asyncHandler(async (req, res) => {
    const query = req.params.q || '';
    const id = req.params.id;
    let type = req.params.type;
    let t = 'movie';
    if (type === 'series') t = 'tv'
    const iframeSrc = `https://vidsrc.to/embed/${t}/${id}`;
    const canonical = `${res.locals.APP_URL}/view/${id}/${type}`;
    const data = await fetchOmdbData(id, false);
    res.render('view', { data, iframeSrc, query, id, type, canonical, user: req.user });
  }),

  /**
   * @function getSearch
   * @memberof appController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the rendering of the search results page.
   * It sets the canonical URL and renders the 'search' template with the specified parameters.
   * @return {Promise<void>}
   */
  getSearch: asyncHandler(async (req, res) => {
    const query = req.query.q.trim();
    const type = req.query.type || 'movie';
    const omdbSearch = await fetchOmdbData(query, true, type);
    const results = omdbSearch.Search || [];
    const canonical = `${res.locals.APP_URL}/search/?q=${query}&type=${type}`;
    if (!query) res.redirect('/');
    res.render('search', { query, results, type, canonical, card: res.locals.CARD_TYPE, user: req.user });
  })
};

module.exports = appController;
