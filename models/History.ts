/**
 * @module models/History
 * @description Mongoose model for tracking user watch history.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHistory extends Document {
  userId: Types.ObjectId;
  imdbId: string;
  type: 'movie' | 'series';
  watched: boolean;
  lastSeason?: number;
  lastEpisode?: number;
  markWatched(): Promise<void>;
  updatePosition(season: number, episode: number): Promise<void>;
}

const definition = {
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  imdbId: { type: String, required: true },
  type: { type: String, enum: ['movie', 'series'], required: true },
  watched: { type: Boolean, default: false },
  lastSeason: { type: Number, required: false },
  lastEpisode: { type: Number, required: false },
};

const HistorySchema = new Schema<IHistory>(definition, { timestamps: true });

HistorySchema.index({ userId: 1, imdbId: 1 }, { unique: true });

HistorySchema.methods.markWatched = async function (this: IHistory): Promise<void> {
  this.watched = true;
  await this.save();
};

HistorySchema.methods.updatePosition = async function (
  this: IHistory,
  season: number,
  episode: number
): Promise<void> {
  this.lastSeason = season;
  this.lastEpisode = episode;
  await this.save();
};

const History = mongoose.model<IHistory>('History', HistorySchema);
export default History;
