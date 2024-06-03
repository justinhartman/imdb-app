const passport = require('passport');

require('../config/passport')(passport);
const User = require('../models/User');

/**
 * @module authController
 * @description This module contains the authentication controller functions.
 */
const authController = {
  /**
   * @function register
   * @memberof authController
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @description This function handles the registration of a new user. It checks if the user already exists, creates a new user if not, and redirects accordingly.
   * @returns {void}
   */
  register: async (req, res) => {
    try {
      const { username, password } = req.body;
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
  },

  /**
   * @function login
   * @memberof authController
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @description This function handles the login process using Passport. It redirects to the profile page on successful authentication, and to the login page on failure.
   * @returns {void}
   */
  login: async (req, res) => {
    try {
      await passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true,
      })(req, res);
    } catch (error) {
      req.flash('error_msg', `Failed to authenticate. ${error.message}`);
      res.redirect('/login');
    }
  },

  /**
   * @function logout
   * @memberof authController
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @description This function handles the logout process. It logs the user out and redirects to the home page.
   * @returns {void}
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
