require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

/** Add these configurations to a file called `.env` in the root of the project */
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

/**
 * Fetches the poster image URL for a movie or TV show using the OMDB API.
 * @param {string} imdbID - The IMDb ID of the movie or TV show.
 * @returns {Promise<string|null>} A Promise that resolves to the poster image URL or null if an error occurs.
 */
const getPoster = async (imdbID) => {
    try {
        const response = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`);
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

/**
 * Handles the '/' route.
 * This route is responsible for rendering the home page with new movies and TV shows.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered home page.
 * @returns {void} - No return value.
 */
app.get('/', async (req, res) => {
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
        await fetchAndUpdatePosters(newMovies);

        // Fetch and update poster images for new TV shows.
        newSeries = axiosSeriesResponse.data.result.items || [];
        await fetchAndUpdatePosters(newSeries);
    } catch (error) {
        console.error('Error fetching top movies and TV shows:', error);
    }

    res.render('index', { newMovies, newSeries: newSeries, query, type, results: [] });
});

/**
 * Handles the '/search' route.
 * This route is responsible for searching for movies or TV shows based on the provided query.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered search results page.
 * @returns {void} - No return value.
 */
app.get('/search', async (req, res) => {
    const query = req.query.q;
    const type = req.query.type || 'movie';
    let results = [];

    if (query) {
        try {
            const response = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${query}&type=${type}`);
            results = response.data.Search || [];
        } catch (error) {
            console.error('Error searching for movies/TV shows:', error);
        }
    }

    res.render('index', { query, type, results, newMovies: [], newSeries: [] });
});

/**
 * Handles the '/view/:id' route.
 * This route is responsible for rendering the view page for a specific video.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered view page.
 * @returns {void} - No return value.
 */
app.get('/view/:id', async (req, res) => {
    const id = req.params.id;
    let type = req.query.type || 'movie';
    if (type === 'series') { type = 'tv' }
    const iframeSrc = `https://vidsrc.to/embed/${type}/${id}`;

    res.render('view', { iframeSrc });
});

/**
 * Starts the server and listens on the specified port.
 * @param {Number} PORT - The port number on which the server will listen on.
 * @returns {void} - No return value.
 */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
