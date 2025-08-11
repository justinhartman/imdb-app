/**
 * @module routes/watchlist
 * @description Express router module for handling watchlist-related operations.
 * Provides endpoints for viewing, adding, and deleting items from user watchlists.
 * All routes require authentication via ensureAuthenticated middleware.
 */

import { Router } from 'express';
import watchlistController from '../controllers/watchlistController';
import { ensureAuthenticated } from '../middleware/auth';
import dbSessionMiddleware from '../middleware/dbSession';

const router = Router();

dbSessionMiddleware(router);

/**
 * @route GET /watchlist
 * @description Retrieves the authenticated user's watchlist.
 * @access Private - Requires authentication
 */
router.get('/', ensureAuthenticated, watchlistController.getWatchlist);

/**
 * @route POST /watchlist/add
 * @description Adds a new item to the authenticated user's watchlist.
 * @access Private - Requires authentication
 */
router.post('/add', ensureAuthenticated, watchlistController.addToWatchlist);

/**
 * @route POST /watchlist/delete
 * @description Removes an item from the authenticated user's watchlist.
 * @access Private - Requires authentication
 */
router.post('/delete', ensureAuthenticated, watchlistController.deleteFromWatchlist);

export default router;

