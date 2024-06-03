/**
 * Binger App.
 * Web application that provides a user-friendly interface for searching and watching movies and TV shows.
 * @author     Justin Hartman <code@justhart.com>
 * @copyright  Copyright (c) 2024, Justin Hartman <https://justhart.com>
 * @link       https://binger.uk Binger UK
 * @license    MIT
 * @version    0.0.1
 */

/** @inheritDoc */
const express = require('express');
const app = express();
const path = require('path');

const appConfig = require('./config/app');
const appHelper = require('./helpers/appHelper');
const appRoutes = require('./routes/app');
const authRoutes = require('./routes/auth');

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
app.set('views', path.join(__dirname, 'views'));

/**
 * Uses the provided routes middleware for the specified path.
 * @param {String} path - The path to the directory containing the static files.
 * @returns {void} - No return value.
 */
app.use(express.static('public'));

/**
 * Conditionally uses the provided routes middleware for the root path ('/').
 * If MONGO_DB_URI is not empty, it uses both appRoutes and authRoutes middlewares.
 * Otherwise, it only uses appRoutes middleware.
 * @param {Object} routes - The routes middleware to be used for the root path.
 * @returns {void} - No return value.
 */
appConfig.MONGO_DB_URI !== '' ? app.use('/', appRoutes, authRoutes) : app.use('/', appRoutes);

/**
 * Starts the server and listens on the specified port.
 * @param {String} API_HOST - The host name on which the server will listen on.
 * @param {Number} API_PORT - The port number on which the server will listen on.
 * @returns {void} - No return value.
 */
app.listen(appConfig.API_PORT, appConfig.API_HOST, () => {
  console.log(`Server is running on http://${appConfig.API_HOST}:${appConfig.API_PORT}`);
});
