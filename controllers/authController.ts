import { Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import passport from 'passport';
import passportConfig from '../config/passport';
import User from '../models/User';

passportConfig(passport);

const authController = {
  /** Render the registration page */
  getRegister: asyncHandler(async (req: any, res: Response) => {
    const canonical = `${res.locals.APP_URL}/user/register`;
    res.render('register', { canonical, query: '', type: 'movie' });
  }),

  /** Register a new user */
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

  /** Render the login page */
  getLogin: asyncHandler(async (req: any, res: Response) => {
    const canonical = `${res.locals.APP_URL}/user/login`;
    res.render('login', { canonical, query: '', type: 'movie' });
  }),

  /** Login using Passport */
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

  /** Render the user profile */
  getProfile: asyncHandler(async (req: any, res: Response) => {
    const canonical = `${res.locals.APP_URL}/user/profile`;
    res.render('profile', { canonical, query: '', type: 'movie', user: req.user });
  }),

  /** Logout user */
  logout: (req: any, res: Response, next: NextFunction): void => {
    req.logout((error: any) => {
      if (error) return next(error);
      req.flash('success_msg', 'You are now logged out of the app.');
      res.redirect('/');
    });
  },
};

export default authController;

