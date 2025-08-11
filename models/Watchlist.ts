/**
 * @module models/Watchlist
 * @description Mongoose model for managing user watchlists of movies and TV shows.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface representing a single item in a user's watchlist.
 * @interface IWatchlistItem
 * @property {string} imdbId - The IMDB ID of the movie/show
 * @property {string} title - The title of the movie/show
 * @property {string} poster - URL to the movie/show poster image
 * @property {'movie' | 'series' | 'episode'} type - The type of media
 * @property {string} [plot] - Optional plot summary
 * @property {string} [year] - Optional release year
 * @property {string} [genre] - Optional genre(s)
 * @property {string} [rated] - Optional content rating
 * @property {string} [runtime] - Optional runtime duration
 * @property {string} [imdbRating] - Optional IMDB rating
 * @property {string} [totalSeasons] - Optional number of seasons (for series)
 */
export interface IWatchlistItem {
  imdbId: string;
  title: string;
  poster: string;
  type: 'movie' | 'series' | 'episode';
  plot?: string;
  year?: string;
  genre?: string;
  rated?: string;
  runtime?: string;
  imdbRating?: string;
  totalSeasons?: string;
}

/**
 * Interface for the Watchlist document model.
 * @interface IWatchlist
 * @extends {Document}
 * @property {Types.ObjectId} userId - Reference to the user who owns this watchlist
 * @property {IWatchlistItem[]} items - Array of watchlist items
 */
export interface IWatchlist extends Document {
  userId: Types.ObjectId;
  items: IWatchlistItem[];
  isInWatchlist(imdbId: string): Promise<boolean>;
  addToWatchlist(imdbId: string, title: string, poster: string, type: string): Promise<void>;
  deleteFromWatchlist(imdbId: string): Promise<void>;
}

const definition = {
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
  return await this.items.some((item) => item.imdbId === imdbId);
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
