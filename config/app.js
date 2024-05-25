require('dotenv').config();
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const PORT = process.env.PORT || 3000;

module.exports = { OMDB_API_KEY, PORT };