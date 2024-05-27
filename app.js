const express = require('express');
const app = express();
const path = require('path');

const routes = require('./routes/appRoutes');
const { API_HOST, API_PORT, APP_URL } = require('./config/app');

/**
 * Middleware function that sets the APP_URL as a local variable for the views.
 * @param {Request} req - The request object containing the HTTP request details.
 * @param {Response} res - The response object containing the HTTP response details.
 * @param {NextFunction} next - The next middleware function in the chain.
 */
app.use((req, res, next) => {
    res.locals.APP_URL = APP_URL;
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Uses the provided static middleware for the specified path.
 * @param {String} path - The path to the directory containing the static files.
 * @returns {void} - No return value.
 */
app.use(express.static('public'));

/**
 * Uses the provided routes middleware for the root path ('/').
 * @param {Object} routes - The routes middleware to be used for the root path.
 * @returns {void} - No return value.
 */
app.use('/', routes);

/**
 * Starts the server and listens on the specified port.
 * @param {String} API_HOST - The host name on which the server will listen on.
 * @param {Number} API_PORT - The port number on which the server will listen on.
 * @returns {void} - No return value.
 */
app.listen(API_PORT, API_HOST, () => {
  console.log(`Server is running on http://${API_HOST}:${API_PORT}`);
});
