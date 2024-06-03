/**
 * User Schema for MongoDB using Mongoose.
 * @module User
 * @description This module exports a Mongoose schema for the User model.
 */

/** @inheritDoc */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User model schema definition.
 * @typedef {Object} SchemaDefinition
 * @property {String} username - The user's unique email which is used as the username.
 * @property {String} password - The user's password.
 * @property {Boolean} isVerified - Whether the user has verified their email address.
 * @property {Array} watchlist - An array of objects representing the user's watchlist.
 */
const definition = {
  username: {
    type: String,
    required: true,
    minlength: 5,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    validate: {
      validator: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value),
      message: 'Not a valid email address.',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255,
    // validate: [
    //   function (password) {
    //     const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    //     return regex.test(password);
    //   },
    //   'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    // ],
  },
  watchlist: [{
    imdbID: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['movie', 'series', 'episode'],
      required: true,
    },
    plot: {
      type: String,
      required: false,
    },
    year: {
      type: String,
      required: false,
    },
    genre: {
      type: String,
      required: false,
    },
    rated: {
      type: String,
      required: false,
    },
    runtime: {
      type: String,
      required: false,
    },
    imdbRating: {
      type: String,
      required: false,
    },
    totalSeasons: {
      type: String,
      required: false,
    },
  }],
};

/**
 * User Schema creation.
 * @param {mongoose.Schema} schema - The UserSchema instance.
 * @returns {mongoose.Model<User>} - The User Mongoose model.
 */
const UserSchema = new mongoose.Schema(definition, { timestamps: true });

/**
 * Pre-save hook to hash the user's password before saving it to the database.
 * @param {User} user - The User instance.
 * @param {Function} next - The next callback function to be called in the middleware chain.
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error.message);
  }
});

/**
 * Method to compare the entered password with the hashed password stored in the database.
 * @param {String} password - The password entered by the user.
 * @returns {Promise<Boolean>} - A promise that resolves to true if the passwords match, and false otherwise.
 */
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Method to check if the user is in the watchlist.
 * @function
 * @param {String} imdbID - The IMDB ID of the media to check.
 * @returns {Promise<Boolean>} - A promise that resolves to true if the user is in the watchlist, and false otherwise.
 */
UserSchema.methods.isInWatchlist = async function (imdbID) {
  return await this.watchlist.some((item) => item.imdbID === imdbID);
};

/**
 * Method to add a media to the user's watchlist.
 * @function
 * @param {String} imdbID - The IMDB ID of the media to add.
 * @param {String} title - The title of the media.
 * @param {String} poster - The poster of the item.
 * @param {String} type - The type of media.
 */
UserSchema.methods.addToWatchlist = async function (imdbID, title, poster, type) {
  if (!await this.isInWatchlist(imdbID)) {
    this.watchlist.push({ imdbID, title, poster, type });
    await this.save();
  }
};

/**
 * Method to remove a media from the user's watchlist.
 * @function
 * @param {String} imdbID - The IMDB ID of the media to remove.
 */
UserSchema.methods.deleteFromWatchlist = async function (imdbID) {
  if (await this.isInWatchlist(imdbID)) {
    this.watchlist = this.watchlist.filter((item) => item.imdbID !== imdbID);
    await this.save();
  }
};

/**
 * User Mongoose model.
 * @constructor
 * @returns {mongoose.Model<User>} - The User Mongoose model.
 */
const User = mongoose.model('User', UserSchema);

/**
 * Exports the User Schema instance.
 * @function
 * @returns {mongoose.Model<User>} - The User Mongoose model.
 */
module.exports = User;
