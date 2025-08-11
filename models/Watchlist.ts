import mongoose, { Document, Schema, Types } from 'mongoose';

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

WatchlistSchema.methods.isInWatchlist = async function (
  this: IWatchlist,
  imdbId: string
): Promise<boolean> {
  return await this.items.some((item) => item.imdbId === imdbId);
};

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

