const User = require('../models/User');

/**
 * @module watchlistController
 * @description This module contains functions for managing a user's watchlist.
 */
const watchlistController = {
  /**
   * @function addToWatchlist
   * @description Adds a movie or TV show to the user's watchlist.
   * @param {Request} req - The request object containing the user and movie or TV show data.
   * @param {Response} res - The response object.
   * @returns {Promise<void>} - A promise that resolves when the movie or TV show is added to the watchlist.
   */
  addToWatchlist: async (req, res) => {
    const { imdbID, title, poster, type } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (!user.watchlist.some(item => item.imdbID === imdbID)) {
        user.watchlist.push({ imdbID, title, poster, type });
        await user.save();
      }
      req.flash('success_msg', `Added ${title} to watchlist.`);
      res.redirect('/profile');
    } catch (error) {
      console.error(error.message);
      req.flash('error_msg', `Failed to add to watchlist. ${error.message}`);
      res.redirect('/');
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
    const { imdbID } = req.body;
    const user = await User.findById(req.user.id);
    if (user.watchlist.some(item => item.imdbID === imdbID)) {
      await User.findByIdAndUpdate(
        user.id,
        { $pull: { watchlist: { imdbID: imdbID } } },
        { new: true }
      );
      req.flash('success_msg', 'Removed item from your watchlist.');
      res.redirect('/profile');
    } else {
      req.flash('error_msg', 'Could not find item in your watchlist.');
      res.redirect('/profile');
    }
  }
};

module.exports = watchlistController;
