import { Request } from 'express';

export interface EpisodeInfo {
  episode: number;
  title?: string;
}

export interface SeasonDetail {
  season: number;
  episodes: EpisodeInfo[];
}

export interface SeriesDetail {
  totalSeasons: number;
  totalEpisodes: number;
  seasons: SeasonDetail[];
}

export interface AuthRequest extends Request {
  user?: any;
}
