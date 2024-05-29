require('dotenv').config();

// These two configs are used for the Node.js server and should work out the box.
const API_HOST = process.env.API_URL || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

// Change the APP_URL to the domain where you will be using the application on.
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Very important you set your own APP_SECRET as this is unique to your app and used for authentication.
const APP_SECRET = process.env.APP_SECRET || 'DnOBGdGY3YjGFWLkvhGquqtSmlSKBMFw';

// These ensure you are making the correct connection to your MongoDB instance.
const MONGO_URI = process.env.MONGO_URI;
const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_PORT = process.env.MONGO_PORT;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

/**
 * This builds out the proper MongoDB URI string so the app uses the correct version.
 * We check if you have a username and password set on your instance else we use the standard connection string.
 * @type {string}
 */
const MONGO_DB_URI = MONGO_USERNAME && MONGO_PASSWORD
  ? `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}`
  : `${MONGO_URI}`;


// Make sure you update the OMDB_API_KEY else the application will not work. Get your free one at https://omdbapi.com
const OMDB_API_KEY = process.env.OMDB_API_KEY;

// You should never change these unless OMDb change their API endpoints.
const OMDB_API_URL = process.env.OMDB_API_URL || 'http://www.omdbapi.com';
const OMDB_IMG_URL = process.env.OMDB_IMG_URL || 'http://img.omdbapi.com';

module.exports = {
  API_HOST,
  API_PORT,
  APP_SECRET,
  APP_URL,
  MONGO_DB_NAME,
  MONGO_DB_URI,
  OMDB_API_KEY,
  OMDB_API_URL,
  OMDB_IMG_URL
};
