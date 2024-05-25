const express = require('express');
const axios = require("axios");
const router = express.Router();

const config = require('../config/app');
const appHelper = require('../helpers/appHelper');

/**
 * Handles the '/' route.
 * This route is responsible for rendering the home page with new movies and TV shows.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered home page.
 * @returns {void} - No return value.
 */
router.get('/', async (req, res) => {
  let newMovies = [];
  let newSeries = [];
  const query = req.query.q || '';
  const type = req.query.type || 'movie';

  try {
    /**
     * Fetch new movies from VidSrc.
     * You can switch to new movies instead with 'https://vidsrc.to/vapi/movie/new'
     * @type {axios.AxiosResponse<any>}
     * @docs https://vidsrc.to/#api
     */
    const axiosMovieResponse = await axios.get('https://vidsrc.to/vapi/movie/add');
    /**
     * Fetch new TV shows from VidSrc.
     * You can switch to new movies instead with 'https://vidsrc.to/vapi/tv/new'
     * @type {axios.AxiosResponse<any>}
     * @docs https://vidsrc.to/#api
     */
    const axiosSeriesResponse = await axios.get('https://vidsrc.to/vapi/tv/add');

    // Fetch and update poster images for new movies.
    newMovies = axiosMovieResponse.data.result.items || [];
    await appHelper.fetchAndUpdatePosters(newMovies);

    // Fetch and update poster images for new TV shows.
    newSeries = axiosSeriesResponse.data.result.items || [];
    await appHelper.fetchAndUpdatePosters(newSeries);
  } catch (error) {
    console.error('Error fetching top movies and TV shows:', error);
  }

  res.render('index', { newMovies, newSeries: newSeries, query, type, results: [] });
});

/**
 * Handles the '/view/:id' route.
 * This route is responsible for rendering the view page for a specific video.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered view page.
 * @returns {void} - No return value.
 */
router.get('/view/:id', async (req, res) => {
    const id = req.params.id;
    let type = req.query.type || 'movie';
    if (type === 'series') { type = 'tv' }
    const iframeSrc = `https://vidsrc.to/embed/${type}/${id}`;

    res.render('view', { iframeSrc });
});

/**
 * Handles the '/search' route.
 * This route is responsible for searching for movies or TV shows based on the provided query.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered search results page.
 * @returns {void} - No return value.
 */
router.get('/search', async (req, res) => {
    const query = req.query.q;
    const type = req.query.type || 'movie';
    let results = [];

    if (query) {
        try {
            const response = await axios.get(`http://www.omdbapi.com/?apikey=${config.OMDB_API_KEY}&s=${query}&type=${type}`);
            results = response.data.Search || [];
        } catch (error) {
            console.error('Error searching for movies/TV shows:', error);
        }
    }

    res.render('index', { query, type, results, newMovies: [], newSeries: [] });
});

module.exports = router;