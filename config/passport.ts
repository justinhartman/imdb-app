/**
 * Passport.js configuration module.
 * @module config/passport
 * @description This module exports a function that configures Passport.js for local strategy.
 */

import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';

export default (passport: any): void => {
  passport.use(
    new LocalStrategy(async (username: string, password: string, done: any) => {
      try {
        const user = await User.findOne({ username });
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
      } catch (error: any) {
        return done(error.message);
      }
    })
  );

  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done: any) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error: any) {
      done(error.message);
    }
  });
};

