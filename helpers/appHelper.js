const axios = require('axios');
const asyncHandler = require('express-async-handler');
const config = require('../config/app');

/**
 * Constructs the OMDB API URL based on the query and type parameters.
 * @param {string} query - The query string to search for movies or TV shows.
 * @param {boolean} [search=true] - Search or standard query, default true.
 * @param {string} type - The type of media to search for ('movie' or 'series'), default empty.
 * @returns {string} The constructed OMDB API URL.
 */
function constructOmdbUrl(query, search = true, type = '') {
  let url = `https://www.omdbapi.com/?apikey=${config.OMDB_API_KEY}&s=${query}&type=${type}`;
  if (type === '' && search === false) {
    url = `https://www.omdbapi.com/?apikey=${config.OMDB_API_KEY}&i=${query}`
  } else if (type === '' && search === true) {
    url = `https://www.omdbapi.com/?apikey=${config.OMDB_API_KEY}&s=${query}`
  }
  return url;
}

/**
 * Fetches search results from OMDB API.
 * @param {string} query - The query string to search for movies or TV shows.
 * @param {boolean} [search=true] - Search or standard query, default true.
 * @param {string} type - The type of media to search for ('movie' or 'series'), default empty.
 * @returns {Promise<Array>} A Promise that resolves to an array of search results or an empty array if no results are found.
 */
const fetchOmdbData = async (query, search = true, type = '') => {
  if(!query) return [];
  const url = constructOmdbUrl(query, search, type);
  const results = (await axios.get(url)).data || [];
  return results || [];
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