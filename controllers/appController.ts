import axios from 'axios';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

import appConfig from '../config/app';
import { fetchOmdbData, fetchAndUpdatePosters } from '../helpers/appHelper';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * @module appController
 * @description This module contains the standard application controller functions.
 */
const appController = {
  /**
   * @function getHome
   * @description Render the home page with new movies and TV shows.
   */
  getHome: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = (req.query.q as string) || '';
    const type = (req.query.type as string) || 'movie';
    const canonical = res.locals.APP_URL;

    const axiosMovieResponse = await axios.get(
      `https://${appConfig.VIDSRC_DOMAIN}/movies/latest/page-1.json`
    );
    let newMovies = axiosMovieResponse.data.result || [];
    await fetchAndUpdatePosters(newMovies);

    const axiosSeriesResponse = await axios.get(
      `https://${appConfig.VIDSRC_DOMAIN}/tvshows/latest/page-1.json`
    );
    let newSeries = axiosSeriesResponse.data.result || [];
    await fetchAndUpdatePosters(newSeries);

    res.render('index', {
      newMovies,
      newSeries,
      query,
      type,
      canonical,
      card: res.locals.CARD_TYPE,
      user: req.user,
    });
  }),

  /**
   * @function getView
   * @description Render a movie or TV video player page.
   */
  getView: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.params.q || '';
    const id = req.params.id;
    let type = req.params.type;
    let t = 'movie';

    if (type === 'series') {
      const season = req.params.season || '1';
      const episode = req.params.episode || '1';
      const iframeSrc = `https://${appConfig.VIDSRC_DOMAIN}/embed/tv?imdb=${id}&season=${season}&episode=${episode}`;
      const canonical = `${res.locals.APP_URL}/view/${id}/${type}/${season}/${episode}`;
      const data = await fetchOmdbData(id, false);
      return res.render('view', {
        data,
        iframeSrc,
        query,
        id,
        type,
        season,
        episode,
        canonical,
        user: req.user,
      });
    }

    const iframeSrc = `https://${appConfig.VIDSRC_DOMAIN}/embed/${t}/${id}`;
    const canonical = `${res.locals.APP_URL}/view/${id}/${type}`;
    const data = await fetchOmdbData(id, false);
    res.render('view', {
      data,
      iframeSrc,
      query,
      id,
      type,
      canonical,
      user: req.user,
    });
  }),

  /**
   * @function getSearch
   * @description Render the search results page.
   */
  getSearch: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = (req.query.q as string).trim();
    const type = (req.query.type as string) || 'movie';
    const omdbSearch = await fetchOmdbData(query, true, type);
    const results = omdbSearch.Search || [];
    const canonical = `${res.locals.APP_URL}/search/?q=${query}&type=${type}`;
    if (!query) res.redirect('/');
    res.render('search', {
      query,
      results,
      type,
      canonical,
      card: res.locals.CARD_TYPE,
      user: req.user,
    });
  }),
};

export default appController;

