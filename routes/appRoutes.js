const express = require('express');
const axios = require("axios");
const asyncHandler = require('express-async-handler');
const router = express.Router();

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

  res.render('index', {newMovies, newSeries, query, type, results: []});
}));

/**
 * Handles the '/view/:id' route.
 * This route is responsible for rendering the view page for a specific video.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered view page.
 * @returns {void} - No return value.
 */
router.get('/view/:id', asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  let type = req.query.type || 'movie';
  if (type === 'series') type = 'tv'
  const iframeSrc = `https://vidsrc.to/embed/${type}/${id}`;
  res.render('view', {iframeSrc});
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
  const omdbSearch = await fetchOmdbData(query, true, type);
  const results = omdbSearch.Search || [];
  if (!query) res.redirect('/');
  res.render('index', {query, type, results, newMovies: [], newSeries: []});
}));

module.exports = router;
