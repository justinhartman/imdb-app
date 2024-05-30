/**
 * Passport.js configuration module.
 * @module config/passport
 * @description This module exports a function that configures Passport.js for local strategy.
 */

/** @inheritDoc */
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

/**
 * It sets up the user authentication process using username and password.
 * @param {Object} passport - The Passport.js instance.
 * @returns {void}
 */
module.exports = (passport) => {
  /**
   * This function is a middleware for Passport.js that authenticates a user using their username and password.
   * It checks if the user exists in the database and if the provided password matches the stored password hash.
   * @param {string} username - The username of the user to be authenticated.
   * @param {string} password - The password provided by the user.
   * @param {Function} done - A callback function that is called when the authentication process is complete.
   * @returns {void}
   */
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
      } catch (error) {
        return done(error.message);
      }
    })
  );

  /**
   * This function is the middleware for Passport.js that serialises the user object into an ID.
   * It is used to persist the user session across requests.
   * @param {Object} user - The users object to be serialised.
   * @param {Function} done - A callback function called when the serialisation process is complete.
   * @returns {void}
   */
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  /**
   * @description
   * This function is a middleware for Passport.js that deserialises the user ID into a user object.
   * It is used to retrieve the user object from the session store.
   * @param {string} id - The ID of the user to be deserialised.
   * @param {Function} done - A callback function called when the deserialization process is complete.
   * @returns {void}
   */
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error.message);
    }
  });
};
