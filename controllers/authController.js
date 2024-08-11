const passport = require('passport');
require('../config/passport')(passport);
const User = require('../models/User');

/**
 * @module authController
 * @description This module contains the authentication controller functions.
 */
const authController = {
  /**
   * @function getRegister
   * @memberof authController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the rendering of the registration page.
   * It sets the canonical URL and renders the 'register' template with the specified parameters.
   * @return {Promise<void>}
   */
  getRegister: async (req, res) => {
    const canonical = `${res.locals.APP_URL}/user/register`;
    res.render('register', { canonical, query: '', type: 'movie' });
  },

  /**
   * @function postRegister
   * @memberof authController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the registration of a new user.
   * It checks if the user already exists, creates a new user if not, and redirects accordingly.
   * @return {Promise<void>}
   */
  postRegister: async (req, res) => {
    try {
      const { username, password } = req.body;
      let user = await User.findOne({ username });
      if (user) return res.redirect('/user/register');
      user = new User({ username, password });
      await user.save();
      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/user/login');
    } catch (error) {
      req.flash('error_msg', `Failed to register. ${error.message}`);
      res.redirect('/user/register');
    }
  },

  /**
   * @function getLogin
   * @memberof authController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the rendering of the login page.
   * It sets the canonical URL and renders the 'login' template with the specified parameters.
   * @return {Promise<void>}
   */
  getLogin: async (req, res) => {
    const canonical = `${res.locals.APP_URL}/user/login`;
    res.render('login', { canonical, query: '', type: 'movie' });
  },

  /**
   * @function login
   * @memberof authController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the login process using Passport.
   * It redirects to the profile page on successful authentication, and to the login page on failure.
   * @return {Promise<void>}
   */
  postLogin: async (req, res) => {
    try {
      await passport.authenticate('local', {
        successRedirect: '/user/profile',
        failureRedirect: '/user/login',
        failureFlash: true,
      })(req, res);
    } catch (error) {
      req.flash('error_msg', `Failed to authenticate. ${error.message}`);
      res.redirect('/user/login');
    }
  },

  /**
   * @function getProfile
   * @memberof authController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @description This function handles the rendering of the user profile page.
   * It sets the canonical URL, retrieves the user's watchlist, and renders the 'profile' template with the specified parameters.
   * @return {Promise<void>}
   */
  getProfile: async (req, res) => {
    const canonical = `${res.locals.APP_URL}/user/profile`;
    // const watchlist = await Watchlist.find({ userId: req.user.id });
    res.render('profile', { canonical, query: '', type: 'movie', user: req.user });
  },

  /**
   * @function logout
   * @memberof authController
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next middleware function.
   * @description This function handles the logout process. It logs the user out and redirects to the home page.
   */
  logout: (req, res, next) => {
    req.logout((error) => {
      if (error) return next(error.message);
      req.flash('success_msg', 'You are now logged out of the app.');
      res.redirect('/');
    });
  }
};

module.exports = authController;
