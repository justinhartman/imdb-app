/**
 * Authentication routes.
 * @module routes/auth
 * @description This module exports the authentication and user-related routes.
 */

/** @inheritDoc */
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const router = express.Router();

const appConfig = require('../config/app');
const connectDB = require('../config/db');
require('../config/passport')(passport);

const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

/**
 * Make sure the MongoDB URI is defined else stop.
 */
if (appConfig.MONGO_DB_URI === '') return;

/**
 * Connect to MongoDB instance.
 */
connectDB();

/**
 * Middleware for parsing URL-encoded form data.
 * @param {Object} options - Configuration options for the body-parser middleware.
 * @returns {Function} - Express middleware function.
 */
router.use(bodyParser.urlencoded({ extended: false }));

/**
 * Middleware for managing Express sessions.
 * @param {Object} options - Configuration options for the session middleware.
 * @returns {Function} - Express middleware function.
 */
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

/**
 * Middleware for managing flash messages.
 * @returns {Function} - Express middleware function.
 */
router.use(flash());

/**
 * Middleware for handling flash messages.
 * Sets `res.locals.success_msg`, `res.locals.error_msg`, and `res.locals.error`.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered home page.
 * @returns {void} - No return value.
 */
router.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

/**
 * Middleware for initialising Passport.
 * @returns {Function} - Express middleware function.
 */
router.use(passport.initialize());

/**
 * Middleware for handling Passport sessions.
 * @returns {Function} - Express middleware function.
 */
router.use(passport.session());

/**
 * Handles the '/login' route.
 * This route is responsible for rendering the login page.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered login page.
 * @returns {void} - No return value.
 */
router.get('/login', (req, res) => res.render('login'));

/**
 * Handles the '/login' route.
 * This route is responsible for authenticating the user using Passport.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the redirect response.
 * @param {Function} next - Express middleware function used to handle errors.
 * @returns {void} - No return value.
 */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true,
}));

/**
 * Handles the '/register' route.
 * This route is responsible for rendering the registration page.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered registration page.
 * @returns {void} - No return value.
 */
router.get('/register', (req, res) => res.render('register'));

/**
 * Handles the '/register' route.
 * This route is responsible for creating a new user in the database.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the redirect response.
 * @param {Function} next - Express middleware function used to handle errors.
 * @returns {void} - No return value.
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) return res.redirect('/register');
    user = new User({ username, password });
    await user.save();
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/login');
  } catch (error) {
    req.flash('error_msg', `Failed to register. ${error.message}`);
    res.redirect('/register');
  }
});

/**
 * Handles the '/logout' route.
 * This route is responsible for logging the user out of the application.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the redirect response.
 * @param {Function} next - Express middleware function used to handle errors.
 * @returns {void} - No return value.
 */
router.get('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error.message);
    req.flash('success_msg', 'You are now logged out of the app.');
    res.redirect('/');
  });
});

/**
 * Handles the '/profile' route.
 * This route is responsible for rendering the profile page for the authenticated user.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the rendered profile page.
 * @returns {void} - No return value.
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
  res.render('profile', { user: req.user });
});

/**
 * Handles the '/add-to-watchlist' route.
 * This route is responsible for adding a movie or TV show to the user's watchlist.
 * @param {Request} req - Express request object containing the request parameters and query string.
 * @param {Response} res - Express response object used to send the redirect response.
 * @param {Function} next - Express middleware function used to handle errors.
 * @returns {void} - No return value.
 */
router.post('/add-to-watchlist', ensureAuthenticated, async (req, res) => {
  const { imdbID, title, poster, type } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user.watchlist.some(item => item.imdbID === imdbID)) {
      user.watchlist.push({ imdbID, title, poster, type });
      await user.save();
    }
    req.flash('success_msg', `Added ${title} to watchlist.`);
    res.redirect('/profile');
  } catch (error) {
    console.error(error.message);
    req.flash('error_msg', `Failed to add to watchlist. ${error.message}`);
    res.redirect('/');
  }
});

module.exports = router;
