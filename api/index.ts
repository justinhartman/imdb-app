/**
 * Binger App.
 * Web application that provides a user-friendly interface for searching and watching movies and TV shows.
 * @author     Justin Hartman <code@justhart.com>
 * @copyright  Copyright (c) 2024, Justin Hartman <https://justhart.com>
 * @link       https://binger.uk Binger UK
 * @license    MIT
 */

/** @inheritDoc */
const express = require('express');
const app = express();
const path = require('path');
const analytics = require('@vercel/analytics');

const appConfig = require('../config/app');
const connectDB = require('../config/db');
const appHelper = require('../helpers/appHelper');

/** Load Vercel Analytics */
analytics.inject();

/**
 * Middleware function that sets the APP_URL as a local variable for the views.
 * @param {Request} req - The request object containing the HTTP request details.
 * @param {Response} res - The response object containing the HTTP response details.
 * @param {NextFunction} next - The next middleware function in the chain.
 */
app.use((req, res, next) => {
  res.locals.APP_NAME = appConfig.APP_NAME;
  res.locals.APP_SUBTITLE = appConfig.APP_SUBTITLE;
  res.locals.APP_DESCRIPTION = appConfig.APP_DESCRIPTION;
  res.locals.APP_URL = appConfig.APP_URL;
  // We have different card types based on whether the app uses MongoDB or not.
  res.locals.CARD_TYPE = appHelper.useAuth ? 'card-add' : 'card';
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

/**
 * Uses the provided routes middleware for the specified path.
 * @param {String} path - The path to the directory containing the static files.
 * @returns {void} - No return value.
 */
app.use(express.static('public'));

/**
 * Load standard routes and conditionally use additional routes based on the value of useAuth boolean.
 * The method checks if MONGO_DB_URI is true then connects to MongoDB and uses additional middleware.
 */
app.use('/', require('../routes/app'));
// Test if MONGO_DB_URI is set.
if (appHelper.useAuth) {
  // Connect to MongoDB instance.
  connectDB().catch(e => console.log(e.message));
  // Use additional routes.
  app.use('/user', require('../routes/auth'));
  app.use('/watchlist', require('../routes/watchlist'));
}

/**
 * Starts the server and listens on the specified port.
 * @param {String} API_HOST - The host name on which the server will listen on.
 * @param {Number} API_PORT - The port number on which the server will listen on.
 * @returns {void} - No return value.
 */
app.listen(appConfig.API_PORT, appConfig.API_HOST, () => {
  console.log(`Server is running on http://${appConfig.API_HOST}:${appConfig.API_PORT}`);
});

module.exports = app;
