require('dotenv').config();

const API_HOST = process.env.API_URL || 'localhost'
const API_PORT = process.env.API_PORT || 3000;
const APP_URL = process.env.APP_URL || 'http://localhost'
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';
const OMDB_API_URL = process.env.OMDB_API_URL || 'http://www.omdbapi.com'
const OMDB_IMG_URL = process.env.OMDB_IMG_URL || 'http://img.omdb.com'

module.exports = { API_HOST, API_PORT, APP_URL, OMDB_API_KEY, OMDB_API_URL, OMDB_IMG_URL };
