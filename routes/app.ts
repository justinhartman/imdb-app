/**
 * @module routes/app
 * @description Express router providing main application routes.
 */

import { Router } from 'express';
import appController from '../controllers/appController';
import dbSessionMiddleware from '../middleware/dbSession';

const router = Router();

dbSessionMiddleware(router);

/**
 * @route GET /
 * @description Renders the home page
 */
router.get('/', appController.getHome);

/**
 * @route GET /view/:id/:type
 * @description Renders the view page for a movie or TV show.
 * @param {string} id - IMDB ID of the movie/show
 * @param {string} type - Type of media (movie/series)
 */
router.get('/view/:id/:type', appController.getView);

/**
 * @route GET /view/:id/:type/:season/:episode/:autoplay?
 * @description Renders the view page for a specific TV show episode.
 * @param {string} id - IMDB ID of the show
 * @param {string} type - Type of media (series)
 * @param {string} season - Season number
 * @param {string} episode - Episode number
 * @param {string} [autoplay] - Autoplay flag ("1" to enable)
 */
router.get('/view/:id/:type/:season/:episode/:autoplay?', appController.getView);

/**
 * @route GET /search
 * @description Renders the search results page.
 */
router.get('/search', appController.getSearch);

export default router;
