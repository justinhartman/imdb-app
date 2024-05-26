const express = require('express');
const axios = require("axios");
const asyncHandler = require('express-async-handler');
const router = express.Router();

const { APP_URL } = require('../config/app');
const {
  fetchOmdbData,
  fetchAndUpdatePosters
} = require('../helpers/appHelper');

/**
 * Handles the '/' route.
 * This route is responsible for rendering the home page with new movies and TV shows.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered home page.
 * @returns {void} - No return value.
 */
router.get('/', asyncHandler(async (req, res, next) => {
  const url = `${APP_URL}`;
  const query = req.query.q || '';
  const type = req.query.type || 'movie';
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

  res.render('index', { newMovies, newSeries, query, type, url });
}));

/**
 * Handles the '/view/:id/:type' route.
 * This route is responsible for rendering the view page for a specific video.
 * It returns the iFrame VidSrc URL along with parsed OMDB data for the template.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered view page.
 * @returns {void} - No return value.
 */
router.get('/view/:id/:type', asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  let type = req.params.type;
  if (type === 'series') type = 'tv'
  const iframeSrc = `https://vidsrc.to/embed/${type}/${id}`;
  const data = await fetchOmdbData(id, false);
  const url = `${APP_URL}/view/${id}/${req.params.type}`;
  res.render('view', { data, iframeSrc, url });
}));

/**
 * Handles the '/search' route.
 * This route is responsible for searching for movies or TV shows based on the provided query.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered search results page.
 * @returns {void} - No return value.
 */
router.get('/search', asyncHandler(async (req, res, next) => {
  const query = req.query.q;
  const type = req.query.type || 'movie';
  const url = `${APP_URL}/search?q=${query}&type=${type}`;
  const omdbSearch = await fetchOmdbData(query, true, type);
  const results = omdbSearch.Search || [];
  if (!query) res.redirect('/');
  res.render('search', { query, results, type, url });
}));

module.exports = router;
