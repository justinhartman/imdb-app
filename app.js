const express = require('express');
const app = express();
const path = require('path');

const routes = require('./routes/appRoutes');
const config = require('./config/app');

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
 * @param {Number} PORT - The port number on which the server will listen on.
 * @returns {void} - No return value.
 */
app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});
