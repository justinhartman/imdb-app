/**
 * @module models/History
 * @description Mongoose model for tracking user watch history.
 */

import mongoose, { Schema } from 'mongoose';
import type { IHistory } from '../types/interfaces';

/**
 * @const definition
 * @description Schema definition for History model
 * @type {Object} Mongoose schema definition object
 */
const definition: object = {
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  imdbId: {type: String, required: true},
  type: {type: String, enum: ['movie', 'series'], required: true},
  watched: {type: Boolean, default: false},
  lastSeason: {type: Number, required: false},
  lastEpisode: { type: Number, required: false },
};

const HistorySchema = new Schema<IHistory>(definition, { timestamps: true });

HistorySchema.index({ userId: 1, imdbId: 1 }, { unique: true });

/**
 * @method markWatched
 * @description Marks the content as watched and saves the document
 * @returns {Promise<void>}
 */
HistorySchema.methods.markWatched = async function (this: IHistory): Promise<void> {
  this.watched = true;
  await this.save();
};

/**
 * @method updatePosition
 * @description Updates the last watched season and episode numbers
 * @param {number} season - The season number
 * @param {number} episode - The episode number
 * @returns {Promise<void>}
 */
HistorySchema.methods.updatePosition = async function (
  this: IHistory,
  season: number,
  episode: number
): Promise<void> {
  this.lastSeason = season;
  this.lastEpisode = episode;
  await this.save();
};

/**
 * @const History
 * @description Mongoose model for History documents
 */
const History = mongoose.model<IHistory>('History', HistorySchema);
export default History;
