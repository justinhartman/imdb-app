/**
 * Database and Session middleware.
 * @module middleware/dbSession
 * @description This module exports the middleware functions to reuse among routes that require database,
 * session or flash components.
 */

const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const MongoStore = require('connect-mongo');

const appConfig = require('../config/app');
require('../config/passport')(passport);

/**
 * @function dbSessionMiddleware
 * @description This middleware function is used to initialise and configure the Express session,
 * MongoDB store, flash messages, and Passport authentication for the application.
 * @param {Router} router - The Express router object to which the middleware functions will be attached.
 * @returns {void} - This function does not return any value, but it configures the middleware for the router.
 */
const dbSessionMiddleware = (router) => {
  // Make sure the MongoDB URI is defined else stop.
  if (appConfig.MONGO_DB_URI === '') return;

  // Middleware for parsing URL-encoded form data.
  router.use(bodyParser.urlencoded({ extended: false }));

  // Middleware for managing Express sessions.
  router.use(
    session({
      secret: `${appConfig.APP_SECRET}`,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: appConfig.MONGO_DB_URI,
        dbName: appConfig.MONGO_DB_NAME,
      }),
    })
  );

  // Middleware for managing flash messages.
  router.use(flash());

  // Middleware for handling flash messages.
  router.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

  // Middleware for initialising Passport.
  router.use(passport.initialize());

  // Middleware for handling Passport sessions.
  router.use(passport.session());
};

/**
 * Export the middleware.
 * @type {Function}
 */
module.exports = dbSessionMiddleware;
