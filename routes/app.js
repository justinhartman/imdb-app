/**
 * App routes.
 * @module routes/app
 * @description This module exports the application routes.
 */

/** @inheritDoc */
const express = require('express');
const appController = require('../controllers/appController');
const router = express.Router();

//Handles the '/' route.
router.get('/', appController.getHome);
// Handles the '/view/:id/:type' route.
router.get('/view/:id/:type', appController.getView);
// Handles the '/search' route.
router.get('/search', appController.getSearch);

/**
 * Export the router.
 * @type {Router}
 */
module.exports = router;
