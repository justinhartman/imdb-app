const axios = require('axios');
const config = require('../config/app');

/**
 * Fetches the poster image URL for a movie or TV show using the OMDB API.
 * @param {string} imdbID - The IMDb ID of the movie or TV show.
 * @returns {Promise<string|null>} A Promise that resolves to the poster image URL or null if an error occurs.
 */
const getPoster = async (imdbID) => {
    try {
        const response = await axios.get(`http://www.omdbapi.com/?apikey=${config.OMDB_API_KEY}&i=${imdbID}`);
        return response.data.Poster || '/images/no_image_available.png';
    } catch (error) {
        console.error('Error fetching poster:', error);
        return null;
    }
};

/**
 * Fetches and updates the poster images for new movies and TV shows.
 * @param {Array} show - An array of movie or tv objects.
 * @returns {Promise<void>} A Promise that resolves when the poster images are fetched and updated.
 */
const fetchAndUpdatePosters = async (show) => {
    try {
        await Promise.all(show.map(async (x) => {
            x.poster = await getPoster(x.imdb_id);
        }));
    } catch (error) {
        console.error('Error fetching and updating poster images:', error);
    }
};

module.exports = { getPoster, fetchAndUpdatePosters };