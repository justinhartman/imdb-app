import { Response } from 'express';
import asyncHandler from 'express-async-handler';

import Watchlist from '../models/Watchlist';

/**
 * @module watchlistController
 * @description Functions for managing a user's watchlist.
 */
const watchlistController = {
  /** Retrieve the user's watchlist */
  getWatchlist: asyncHandler(async (req: any, res: Response) => {
    try {
      const canonical = `${res.locals.APP_URL}/watchlist`;
      const watchlist = await Watchlist.find({ userId: req.user.id });
      if (!watchlist) {
        req.flash('error_msg', 'No watchlist found.');
        res.redirect('/watchlist');
      }
      res.render('watchlist', { watchlist, canonical, query: '', type: 'movie' });
    } catch (error: any) {
      req.flash('error_msg', `Failed to retrieve watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  }),

  /** Add a movie or TV show to the watchlist */
  addToWatchlist: asyncHandler(async (req: any, res: Response) => {
    const { imdbId, title, poster, type } = req.body;
    try {
      let watchlist = await Watchlist.findOne({ userId: req.user.id });
      if (!watchlist) watchlist = new Watchlist({ userId: req.user.id, items: [] });
      if (!watchlist.items.some((item: any) => item.imdbId === imdbId)) {
        watchlist.items.push({ imdbId, title, poster, type });
        await watchlist.save();
      }
      req.flash('success_msg', `Added ${title} to watchlist.`);
      res.redirect('/watchlist');
    } catch (error: any) {
      req.flash('error_msg', `Failed to add to watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  }),

  /** Remove an item from the watchlist */
  deleteFromWatchlist: asyncHandler(async (req: any, res: Response) => {
    const { imdbId } = req.body;
    try {
      const watchlist = await Watchlist.findOne({ userId: req.user.id });
      if (watchlist && watchlist.items.some((item: any) => item.imdbId === imdbId)) {
        watchlist.items = watchlist.items.filter((item: any) => item.imdbId !== imdbId);
        await watchlist.save();
        req.flash('success_msg', 'Removed item from your watchlist.');
        res.redirect('/watchlist');
      } else {
        req.flash('error_msg', 'Could not find item in your watchlist.');
        res.redirect('/watchlist');
      }
    } catch (error: any) {
      req.flash('error_msg', `Failed to remove from watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  }),
};

export default watchlistController;

