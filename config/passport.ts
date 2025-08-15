/**
 * @module config/passport
 * @description This module exports a function that configures Passport.js for local strategy.
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';

/**
 * Configures and initializes the Passport.js authentication middleware.
 *
 * This function sets up the local strategy for user authentication,
 * handles serialization and deserialization of user sessions, and
 * integrates with a user model for authentication logic.
 *
 * @param {typeof import(passport)} p - The Passport instance to configure.
 * @returns {void}
 */
const passportMiddleware = (p: typeof passport): void => {
    passport.use(
        new LocalStrategy(
            // Adjust usernameField if your form uses a different field name (e.g., 'email')
            {usernameField: 'username', passwordField: 'password'},
            async (username: any, password: string, done:any) => {
        try {
          const user = await User.findOne({ username });
          // Use a generic message to avoid user enumeration
          if (!user) return done(null, false, { message: 'Invalid credentials.' });

          const isMatch = await (user as unknown as VerifyUser).matchPassword(password);
          if (!isMatch) return done(null, false, { message: 'Invalid credentials.' });

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done: any) => {
    try {
      // Mongoose documents provide a string virtual 'id'
      const id = (user as unknown as VerifyUser).id;
      done(null, id);
    } catch (err) {
      done(err as Error);
    }
  });

  passport.deserializeUser(async (id: string, done: any) => {
    try {
      const user = await User.findById(id);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  });
};

export default passportMiddleware;
