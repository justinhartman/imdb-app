require('dotenv').config();
const APP_URL = process.env.APP_URL || 'http://localhost'
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const PORT = process.env.PORT || 3000;

module.exports = { APP_URL, OMDB_API_KEY, PORT };