/**
 * @module controllers/authController
 * @description Authentication controller module handling user authentication and authorisation.
 */

import { Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import passport from 'passport';
import passportConfig from '../config/passport';
import User from '../models/User';

passportConfig(passport);

/**
 * @namespace authController
 * @description The authController contains methods for handling user authentication and authorisation
 * including registration, login, profile rendering, and logout functionality.
 */
const authController = {
  /**
   * Renders the user registration page.
   * @param {Express.Request & {user: any}} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Renders registration page
   */
  getRegister: asyncHandler(async (req: any, res: Response) => {
    const canonical = `${res.locals.APP_URL}/user/register`;
    res.render('register', { canonical, query: '', type: 'movie', user: req.user });
  }),

  /**
   * Processes user registration.
   * @param {Express.Request & {body: RegistrationRequest}} req - Express request object with registration data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Redirects to appropriate page based on registration result
   */
  postRegister: asyncHandler(async (req: any, res: Response) => {
    try {
      const { username, password } = req.body;
      let user = await User.findOne({ username });
      if (user) return res.redirect('/user/register');
      user = new User({ username, password });
      await user.save();
      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/user/login');
    } catch (error: any) {
      req.flash('error_msg', `Failed to register. ${error.message}`);
      res.redirect('/user/register');
    }
  }),

  /**
   * Renders the user login page.
   * @param {Express.Request & {user: any}} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Renders login page
   */
  getLogin: asyncHandler(async (req: any, res: Response) => {
    const canonical = `${res.locals.APP_URL}/user/login`;
    res.render('login', { canonical, query: '', type: 'movie', user: req.user });
  }),

  /**
   * Authenticates user login using Passport local strategy.
   * @param {Express.Request & {body: LoginRequest}} req - Express request object with login credentials
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Redirects to appropriate page based on authentication result
   */
  postLogin: asyncHandler(async (req: any, res: Response) => {
    try {
      await passport.authenticate('local', {
        successRedirect: '/user/profile',
        failureRedirect: '/user/login',
        failureFlash: true,
      })(req, res);
    } catch (error: any) {
      req.flash('error_msg', `Failed to authenticate. ${error.message}`);
      res.redirect('/user/login');
    }
  }),

  /**
   * Renders the user profile page.
   * @param {Express.Request & {user: any}} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Renders profile page with user data
   */
  getProfile: asyncHandler(async (req: any, res: Response) => {
    const canonical = `${res.locals.APP_URL}/user/profile`;
    res.render('profile', { canonical, query: '', type: 'movie', user: req.user });
  }),

  /**
   * Logs out the current user.
   * @param {Express.Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {void} Redirects to home page after logout
   */
  logout: (req: any, res: Response, next: NextFunction): void => {
    req.logout((error: any) => {
      if (error) return next(error);
      req.flash('success_msg', 'You are now logged out of the app.');
      res.redirect('/');
    });
  },
};

export default authController;
