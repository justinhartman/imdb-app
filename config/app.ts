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
 * This builds out the proper MongoDB URI string so the app uses the correct connection.
 * We check if you have a username and password set on your instance else we use the standard connection string.
 * @type {string}
 * @returns {string} The MongoDB URI string.
 */
const mongoUri =
  MONGO_USERNAME && MONGO_PASSWORD
    ? `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}`
    : `${MONGO_URI}`;

/**
 * This function retrieves the application configuration from the environment variables.
 * @returns {Record<string, any>} An object containing the application configuration.
 */
const appConfig = () => {
  return {
    // These two configs are used for the Node.js server and should work out the box.
    API_HOST: process.env.API_URL || 'localhost',
    API_PORT: Number(process.env.API_PORT) || 3000,
    // Very important you set your own APP_SECRET as this is unique to your app and used for authentication.
    APP_SECRET: process.env.APP_SECRET || 'DnOBGdGY3YjGFWLkvhGquqtSmlSKBMFw',
    // Change the APP_URL to the domain where you will be using the application on.
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
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

