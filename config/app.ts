/**
 * Application configuration.
 * @module config/app
 * @description This module exports an object containing the application configuration.
 */

import dotenv from 'dotenv';
dotenv.config();

const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_PORT = process.env.MONGO_PORT;
const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_URI = process.env.MONGO_URI || '';

/**
 * Connection URI for MongoDB.
 *
 * The `mongoUri` variable is a string that dynamically constructs the MongoDB connection URI based on the presence of
 * username and password credentials. If both `MONGO_USERNAME` and `MONGO_PASSWORD` are defined, the URI is built using
 * these credentials along with the `MONGO_HOST` and `MONGO_PORT`. Otherwise, it defaults to the value of `MONGO_URI`.
 *
 * @type {string}
 * @returns {string} The MongoDB URI string.
 */
const mongoUri: string =
  MONGO_USERNAME && MONGO_PASSWORD
    ? `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}`
    : `${MONGO_URI}`;

/**
 * The URL of the application.
 *
 * This variable resolves to the application's base URL, prioritising environment-specific configurations:
 * - If `APP_URL` is set in the environment variables, its value is assigned to `appUrl`.
 * - If `APP_URL` is not defined but `VERCEL_URL` is set, the URL is constructed dynamically
 *   with `https://` as the prefix and the value of `VERCEL_URL`.
 * - Falls back to `http://localhost:3000` if neither `APP_URL` nor `VERCEL_URL` is defined.
 *
 * @type {string}
 * @returns {string} The URL string to use for the application.
 */
const appUrl: string =
  process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

/**
 * Configuration object for the application.
 *
 * This function returns an object containing various configuration settings for the application.
 * Each setting can be configured via environment variables or defaults to a preset value.
 *
 * @function appConfig
 * @returns {Object} Configuration object containing the following properties:
 * - API_HOST: The hostname for the API, defaulting to `localhost` if not set via `process.env.API_URL`.
 * - API_PORT: The port number for the API server, defaulting to `3000` if not set via `process.env.API_PORT`.
 * - APP_SECRET: A unique secret key used for authentication, configurable via `process.env.APP_SECRET`.
 * - APP_URL: The base URL of the application, which can be set via `process.env.APP_URL`.
 * - APP_NAME: The name of the application, defaulting to `Binger` if not configured via `process.env.APP_NAME`.
 * - APP_SUBTITLE: The subtitle of the application, defaulting to an empty string if not set via `process.env.APP_SUBTITLE`.
 * - APP_DESCRIPTION: A brief description of the application, defaulting to a preset string unless overridden via `process.env.APP_DESCRIPTION`.
 * - MONGO_DB_NAME: The name of the MongoDB database, configurable via `process.env.MONGO_DATABASE`.
 * - MONGO_DB_URI: The URI for connecting to the MongoDB database.
 * - OMDB_API_KEY: The API key for accessing the OMDb API, essential for the application's functionality.
 * - OMDB_API_URL: The API endpoint for the OMDb API, defaulting to `http://www.omdbapi.com`.
 * - OMDB_IMG_URL: The URL endpoint for fetching images via the OMDb API, defaulting to `http://img.omdbapi.com`.
 * - VIDSRC_DOMAIN: The domain used for the vidsrc player, defaulting to `vidsrc.in` but can be overridden via `process.env.VIDSRC_DOMAIN`.
 */
const appConfig = () => {
  return {
    // These two configs are used for the Node.js server and should work out the box.
    API_HOST: process.env.API_URL || 'localhost',
    API_PORT: Number(process.env.API_PORT) || 3000,
    // Very important you set your own APP_SECRET as this is unique to your app and used for authentication.
    APP_SECRET: process.env.APP_SECRET || 'DnOBGdGY3YjGFWLkvhGquqtSmlSKBMFw',
    // Change the APP_URL to the domain where you will be using the application on.
    APP_URL: appUrl,
    // Change to the name of your application.
    APP_NAME: process.env.APP_NAME || 'Binger',
    // Change to the subtitle of your application.
    APP_SUBTITLE: process.env.APP_SUBTITLE || '',
    // Change to the description of your application.
    APP_DESCRIPTION:
      process.env.APP_DESCRIPTION ||
      'Free app for searching, browsing and watching movies and TV shows.',
    // The name of your MongoDB database.
    MONGO_DB_NAME: process.env.MONGO_DATABASE,
    MONGO_DB_URI: mongoUri,
    // Make sure you update the OMDB_API_KEY else the application will not work.
    // Get a free API key at https://omdbapi.com
    OMDB_API_KEY: process.env.OMDB_API_KEY,
    // You should never change these unless OMDb change their API endpoints.
    OMDB_API_URL: process.env.OMDB_API_URL || 'http://www.omdbapi.com',
    OMDB_IMG_URL: process.env.OMDB_IMG_URL || 'http://img.omdbapi.com',
    // The vidsrc player domain has been prone to be taken down. Use one of the following domains if it's not working:
    // vidsrc.in, vidsrc.pm, vidsrc.xyz, vidsrc.net
    VIDSRC_DOMAIN: process.env.VIDSRC_DOMAIN || 'vidsrc.in',
  };
};

export default appConfig();
