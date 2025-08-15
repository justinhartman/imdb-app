/**
 * @module models/Watchlist
 * @description Mongoose model for managing user watchlists of movies and TV shows.
 */

import mongoose, { Schema } from 'mongoose';
import type { IWatchlist, IWatchlistItem } from '../types/interfaces';

/**
 * @const definition
 * @description Schema definition for the Watchlist model
 * @type {Object} Mongoose schema definition object
 */
const definition: object = {
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      imdbId: { type: String, required: true },
      title: { type: String, required: true },
      poster: { type: String, required: true },
      type: { type: String, enum: ['movie', 'series', 'episode'], required: true },
      plot: { type: String, required: false },
      year: { type: String, required: false },
      genre: { type: String, required: false },
      rated: { type: String, required: false },
      runtime: { type: String, required: false },
      imdbRating: { type: String, required: false },
      totalSeasons: { type: String, required: false },
    },
  ],
};

const WatchlistSchema = new Schema<IWatchlist>(definition, { timestamps: true });

/**
 * Checks if a movie/show is already in the watchlist.
 * @param {string} imdbId - IMDB ID to check
 * @returns {Promise<boolean>} True if item exists in watchlist, false otherwise
 */
WatchlistSchema.methods.isInWatchlist = async function (
  this: IWatchlist,
  imdbId: string
): Promise<boolean> {
  return this.items.some((item) => item.imdbId === imdbId);
};

/**
 * Adds a new item to the watchlist if it doesn't already exist.
 * @param {string} imdbId - IMDB ID of the movie/show
 * @param {string} title - Title of the movie/show
 * @param {string} poster - Poster URL of the movie/show
 * @param {string} type - Type of media (movie/series/episode)
 * @returns {Promise<void>}
 */
WatchlistSchema.methods.addToWatchlist = async function (
  this: IWatchlist,
  imdbId: string,
  title: string,
  poster: string,
  type: string
): Promise<void> {
  if (!(await this.isInWatchlist(imdbId))) {
    this.items.push({ imdbId, title, poster, type } as IWatchlistItem);
    await this.save();
  }
};

/**
 * Removes an item from the watchlist if it exists.
 * @param {string} imdbId - IMDB ID of the item to remove
 * @returns {Promise<void>}
 */
WatchlistSchema.methods.deleteFromWatchlist = async function (
  this: IWatchlist,
  imdbId: string
): Promise<void> {
  if (await this.isInWatchlist(imdbId)) {
    this.items = this.items.filter((item) => item.imdbId !== imdbId);
    await this.save();
  }
};

const Watchlist = mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);
export default Watchlist;
