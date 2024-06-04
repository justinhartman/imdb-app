/**
 * Authentication routes.
 * @module routes/auth
 * @description This module exports the authentication and user-related routes.
 */

/** @inheritDoc */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');
const dbSessionMiddleware = require('../middleware/dbSession');

// Implement the Database and Session middleware.
dbSessionMiddleware(router);

// Handles the GET request to the '/user/login' route.
router.get('/login', authController.getLogin);
// Handles the POST request to the '/user/login' route.
router.post('/login', authController.postLogin);
// Handles the GET request to the '/user/register' route.
router.get('/register', authController.getRegister);
// Handles the POST request to the '/user/register' route.
router.post('/register', authController.postRegister);
// Handles the GET request to the '/user/logout' route.
router.get('/logout', ensureAuthenticated, authController.logout);
// Handles the GET request to the '/user/profile' route.
router.get('/profile', ensureAuthenticated, authController.getProfile);

/**
 * Export the router.
 * @type {Router}
 */
module.exports = router;
