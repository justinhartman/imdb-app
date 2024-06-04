const Watchlist = require('../models/Watchlist');

/**
 * @module watchlistController
 * @description This module contains functions for managing a user's watchlist.
 */
const watchlistController = {
  /**
   * @function getWatchlist
   * @description Retrieves the user's watchlist from the database.
   * @param {Request} req - The request object containing the user's ID.
   * @param {Response} res - The response object.
   * @returns {Promise<void>} - A promise that resolves when the watchlist is retrieved or an error occurs.
   */
  getWatchlist: async (req, res) => {
    try {
      const canonical = `${res.locals.APP_URL}/watchlist`;
      const watchlist = await Watchlist.find({ userId: req.user.id });
      if (!watchlist) {
        req.flash('error_msg', 'No watchlist found.');
        res.redirect('/watchlist');
      }
      res.render('watchlist', { watchlist, canonical, query: '', type: 'movie' });
    } catch (error) {
      req.flash('error_msg', `Failed to retrieve watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  },

  /**
   * @function addToWatchlist
   * @description Adds a movie or TV show to the user's watchlist.
   * @param {Request} req - The request object containing the user and movie or TV show data.
   * @param {Response} res - The response object.
   * @returns {Promise<void>} - A promise that resolves when the movie or TV show is added to the watchlist.
   */
  addToWatchlist: async (req, res) => {
    const { imdbId, title, poster, type } = req.body;
    try {
      let watchlist = await Watchlist.findOne({ userId: req.user.id });
      if (!watchlist) watchlist = new Watchlist({ userId: req.user.id, items: [] });
      if (!watchlist.items.some(item => item.imdbId === imdbId)) {
        watchlist.items.push({ imdbId, title, poster, type });
        await watchlist.save();
      }
      req.flash('success_msg', `Added ${title} to watchlist.`);
      res.redirect('/watchlist');
    } catch (error) {
      req.flash('error_msg', `Failed to add to watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  },

  /**
   * @function deleteFromWatchlist
   * @description Removes a movie or TV show from the user's watchlist.
   * @param {Request} req - The request object containing the user and movie or TV show data.
   * @param {Response} res - The response object.
   * @returns {Promise<void>} - A promise that resolves when the movie or TV show is removed from the watchlist.
   */
  deleteFromWatchlist: async (req, res) => {
    const { imdbId } = req.body;
    try {
      const watchlist = await Watchlist.findOne({ userId: req.user.id });
      if (watchlist && watchlist.items.some(item => item.imdbId === imdbId)) {
        watchlist.items = watchlist.items.filter(item => item.imdbId !== imdbId);
        await watchlist.save();
        req.flash('success_msg', 'Removed item from your watchlist.');
        res.redirect('/watchlist');
      } else {
        req.flash('error_msg', 'Could not find item in your watchlist.');
        res.redirect('/watchlist');
      }
    } catch (error) {
      req.flash('error_msg', `Failed to remove from watchlist. ${error.message}`);
      res.redirect('/watchlist');
    }
  }
};

module.exports = watchlistController;
