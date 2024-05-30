const axios = require('axios');
const asyncHandler = require('express-async-handler');
const appConfig = require('../config/app');

/**
 * Constructs the parameters for an OMDB API request.
 * @param {string} query - The query string to search for movies or TV shows.
 * @param {boolean} search - Search or standard query, default true.
 * @param {string} type - The type of media to search for ('movie', 'series', or 'episode'), default empty.
 * @returns {Object} An object containing the constructed parameters for the OMDB API request.
 */
const constructOmdbParams = (query, search, type) => {
  return {
    apikey: appConfig.OMDB_API_KEY,
    ...(type && { type: type }),
    ...(search ? { s: query } : { i: query })
  };
};

/**
 * Fetches search results from OMDB API.
 * @param {string} query - The query string to search for movies or TV shows.
 * @param {boolean} [search=true] - Search or standard query, default true.
 * @param {string} type - The type of media to search for ('movie', 'series', or 'episode'), default empty.
 * @returns {Promise<Object>} A Promise that resolves to the search results or an empty object if no results are found.
 */
const fetchOmdbData = async (query, search = true, type = '') => {
  if (!query) return {};
  const params = constructOmdbParams(query, search, type);
  const options = {
    method: 'GET',
    url: appConfig.OMDB_API_URL,
    params: params,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const response = await axios.request(options);
  return response.data || {};
};

/**
 * Fetches and updates the poster images for new movies and TV shows.
 * @param {Array} show - An array of movie or tv objects.
 * @returns {Promise<void>} A Promise that resolves when the poster images are fetched and updated.
 */
const fetchAndUpdatePosters = async (show) => {
  await Promise.all(show.map(async (x) => {
    const data = await fetchOmdbData(x.imdb_id, false);
    x.poster = data.Poster || '/images/no_image_available.png';
  }));
};

module.exports = {
  fetchAndUpdatePosters: asyncHandler(fetchAndUpdatePosters),
  fetchOmdbData: asyncHandler(fetchOmdbData),
};
