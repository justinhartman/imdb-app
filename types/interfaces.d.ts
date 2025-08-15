import { Request } from 'express';
import { Document, Types } from 'mongoose';

/**
 * @interface IHistory
 * @description Interface for the History document model that tracks user's watching progress
 * @extends {Document}
 * @property {Types.ObjectId} userId - Reference to the user who owns this history entry
 * @property {string} imdbId - The IMDB ID of the movie/show
 * @property {'movie' | 'series'} type - The type of media content
 * @property {boolean} watched - Indicates if the content has been watched
 * @property {number} [lastSeason] - Optional last watched season number for series
 * @property {number} [lastEpisode] - Optional last watched episode number for series
 */
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

/**
 * @interface IUser
 * @description Interface for the User document model
 * @extends {Document}
 * @property {string} username - The user's unique username
 * @property {string} password - The user's hashed password
 * @method matchPassword - Compares provided password with stored hash
 */
export interface IUser extends Document {
  username: string;
  password: string;
  matchPassword(password: string): Promise<boolean>;
}

/**
 * @interface IWatchlist
 * @description Interface for the Watchlist document model.
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

/**
 * @interface IWatchlistItem
 * @description Interface representing a single item in a user's watchlist.
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
 * @interface EpisodeInfo
 * @description Interface representing information about a single episode.
 * @property {number} episode - The episode number
 * @property {string} [title] - Optional title of the episode
 */
export interface EpisodeInfo {
  episode: number;
  title?: string;
}

/**
 * @interface SeasonDetail
 * @description Interface representing details about a single season.
 * @property {number} season - The season number
 * @property {EpisodeInfo[]} episodes - Array of episodes in the season
 */
export interface SeasonDetail {
  season: number;
  episodes: EpisodeInfo[];
}

/**
 * @interface SeriesDetail
 * @description Interface representing complete details about a TV series.
 * @property {number} totalSeasons - Total number of seasons in the series
 * @property {number} totalEpisodes - Total number of episodes across all seasons
 * @property {SeasonDetail[]} seasons - Array containing details of each season
 */
export interface SeriesDetail {
  totalSeasons: number;
  totalEpisodes: number;
  seasons: SeasonDetail[];
}

/**
 * @interface AuthRequest
 * @description Extended Express Request interface that includes authenticated user information.
 * @extends {Request}
 * @property {any} [user] - Optional authenticated user object
 */
export interface AuthRequest extends Request {
  user?: any;
}

/**
 * @interface LoginRequest
 * @description This interface encapsulates the necessary credentials required for a user to authenticate.
 * @property {string} username - The username for authentication
 * @property {string} password - The password for authentication
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * @interface RegistrationRequest
 * @description This interface defines the structure for the data required when a user attempts to register.
 * @property {string} username - The desired username of the user
 * @property {string} password - The password chosen by the user
 */
export interface RegistrationRequest {
  username: string;
  password: string;
}
