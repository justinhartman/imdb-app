/**
 * Watchlist Schema for MongoDB using Mongoose.
 * @module Watchlist
 * @description This module exports a Mongoose schema for the Watchlist model.
 */

/** @inheritDoc */
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

/**
 * Watchlist model schema definition.
 * @typedef {Object} SchemaDefinition
 * @param {mongoose.Schema.Types.ObjectId} userId - The ID of the user who owns the watchlist item.
 * @param {mongoose.Schema.Types.ObjectId[]} items - An array of watchlist items.
 */
const definition = {
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      imdbId: {
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
    }
  ],
};


/**
 * Watchlist Schema creation.
 * @param {mongoose.Schema} schema - The WatchlistSchema instance.
 * @returns {mongoose.Model<Watchlist>} - The Watchlist Mongoose model.
 */
const WatchlistSchema = new mongoose.Schema(definition, { timestamps: true });

/**
 * Method to check if the user is in the watchlist.
 * @function
 * @param {String} imdbId - The IMDB ID of the media to check.
 * @returns {Promise<Boolean>} - A promise that resolves to true if the user is in the watchlist, and false otherwise.
 */
WatchlistSchema.methods.isInWatchlist = async function (imdbId) {
  return await this.watchlist.some((item) => item.imdbId === imdbId);
};

/**
 * Method to add a media to the user's watchlist.
 * @function
 * @param {String} imdbId - The IMDB ID of the media to add.
 * @param {String} title - The title of the media.
 * @param {String} poster - The poster of the item.
 * @param {String} type - The type of media.
 */
WatchlistSchema.methods.addToWatchlist = async function (imdbId, title, poster, type) {
  if (!await this.isInWatchlist(imdbId)) {
    this.watchlist.push({ imdbId, title, poster, type });
    await this.save();
  }
};

/**
 * Method to remove a media from the user's watchlist.
 * @function
 * @param {String} imdbId - The IMDB ID of the media to remove.
 */
WatchlistSchema.methods.deleteFromWatchlist = async function (imdbId) {
  if (await this.isInWatchlist(imdbId)) {
    this.watchlist = this.watchlist.filter((item) => item.imdbId !== imdbId);
    await this.save();
  }
};

const Watchlist = mongoose.model('Watchlist', WatchlistSchema);

module.exports = Watchlist;
