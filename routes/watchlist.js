/**
 * Watchlist routes.
 * @module routes/watchlist
 * @description This module exports the watchlist-related routes.
 */

/** @inheritDoc */
const express = require('express');
const router = express.Router();

const watchlistController = require('../controllers/watchlistController');
const { ensureAuthenticated } = require('../middleware/auth');
const dbSessionMiddleware = require('../middleware/dbSession');

// Implement the Database and Session middleware.
dbSessionMiddleware(router);

// Handles the '/watchlist' route.
router.get('/', ensureAuthenticated, watchlistController.getWatchlist);
// Handles the '/watchlist/add' route.
router.post('/add', ensureAuthenticated, watchlistController.addToWatchlist);
// Handles the '/watchlist/delete' route.
router.post('/delete', ensureAuthenticated, watchlistController.deleteFromWatchlist);

/**
 * Export the router.
 * @type {Router}
 */
module.exports = router;
