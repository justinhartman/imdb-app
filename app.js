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
 * Handles the '/' route.
 * This route is responsible for rendering the home page with new movies and TV shows.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered home page.
 * @returns {void} - No return value.
 */
app.get('/', async (req, res) => {
    let newMovies = [];
    let newTVShows = [];
    const query = req.query.q || '';
    const type = req.query.type || 'movie';

    try {
        // Fetch new movies from VidSrc
        const newMovieResponse = await axios.get('https://vidsrc.to/vapi/movie/new');
        // Fetch new TV shows from VidSrc
        const newTVResponse = await axios.get('https://vidsrc.to/vapi/tv/new');

        newMovies = newMovieResponse.data.result.items || [];
        newTVShows = newTVResponse.data.result.items || [];

        // Fetch posters for new movies
        await Promise.all(newMovies.map(async (movie) => {
            const poster = await getPoster(movie.imdb_id);
            movie.poster = poster;
        }));

        // Fetch posters for new TV shows
        await Promise.all(newTVShows.map(async (show) => {
            const poster = await getPoster(show.imdb_id);
            show.poster = poster;
        }));
    } catch (error) {
        console.error('Error fetching top movies and TV shows:', error);
    }

    res.render('index', { newMovies, newTVShows, query, type, results: [] });
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

    res.render('index', { query, type, results, newMovies: [], newTVShows: [] });
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
