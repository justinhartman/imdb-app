require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Home route
app.get('/', async (req, res) => {
    let newMovies = [];
    let newTVShows = [];

    try {
        // Fetch new movies from VidSrc
        const newMovieResponse = await axios.get('https://vidsrc.to/vapi/movie/new');
        // Fetch new TV shows from VidSrc
        const newTVResponse = await axios.get('https://vidsrc.to/vapi/tv/new');

        newMovies = newMovieResponse.data.result.items || [];
        newTVShows = newTVResponse.data.result.items || [];

        // Function to get poster from OMDB
        const getPoster = async (imdbID) => {
            try {
                const response = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`);
                return response.data.Poster;
            } catch (error) {
                console.error('Error fetching poster:', error);
                return null;
            }
        };

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

    res.render('index', { newMovies, newTVShows, query: '', type: '', results: [] });
});

// Search route
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

// View route
app.get('/view/:id', (req, res) => {
    const id = req.params.id;
    let type = req.query.type || 'movie';
    if (type === 'series') { type = 'tv' }
    const iframeSrc = `https://vidsrc.to/embed/${type}/${id}`;
    const title = req.params.Title || 'Video';

    res.render('view', { iframeSrc, title });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
