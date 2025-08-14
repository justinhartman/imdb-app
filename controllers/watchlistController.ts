/**
 * @module controllers/watchlistController
 * @description Controller for managing user watchlist operations including retrieving, adding, and removing items.
 */

import { Response } from 'express';
import asyncHandler from 'express-async-handler';

import Watchlist from '../models/Watchlist';

/**
 * @namespace watchlistController
 * @description Each method handles authentication through req.user and uses flash messages for user feedback.
 */
const watchlistController = {
  /**
   * Retrieves and displays the user's watchlist.
   * @param req - Express request object containing authenticated user information
   * @param res - Express response object
   * @returns Rendered watchlist page with user's saved items
   * @throws Will redirect to watchlist page with error message if retrieval fails
   */
  getWatchlist: asyncHandler(async (req: any, res: Response) => {
    try {
      const canonical = `${res.locals.APP_URL}/watchlist`;
      const watchlist = await Watchlist.find({ userId: req.user.id });
      if (!watchlist) {
        req.flash('error_msg', 'No watchlist found.');
        res.redirect('/watchlist');
      }
      res.render('watchlist', { watchlist, canonical, query: '', type: 'movie', user: req.user });
    } catch (error: any) {
      req.flash('error_msg', `Failed to retrieve watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  }),

  /**
   * Adds a movie or TV show to the user's watchlist.
   * @param req - Express request object containing item details (imdbId, title, poster, type) and user information
   * @param res - Express response object
   * @returns Redirects to watchlist page with success/error message
   * @throws Will redirect to watchlist page with error message if addition fails
   */
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

  /**
   * Removes an item from the user's watchlist.
   * @param req - Express request object containing imdbId and user information
   * @param res - Express response object
   * @returns Redirects to watchlist page with success/error message
   * @throws Will redirect to watchlist page with error message if removal fails
   */
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
