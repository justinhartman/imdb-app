/**
 * @module authRoutes
 * @description Express router configuration for authentication routes including login, registration,
 * logout, and profile management. All routes are prefixed with '/user'.
 */

import { Router } from 'express';
import authController from '../controllers/authController';
import { ensureAuthenticated } from '../middleware/auth';
import dbSessionMiddleware from '../middleware/dbSession';

const router = Router();

dbSessionMiddleware(router);

/** @route GET /user/login - Displays the login form */
router.get('/login', authController.getLogin);
/** @route POST /user/login - Processes the login request */
router.post('/login', authController.postLogin);
/** @route GET /user/register - Displays the registration form */
router.get('/register', authController.getRegister);
/** @route POST /user/register - Processes the registration request */
router.post('/register', authController.postRegister);
/** @route GET /user/logout - Handles user logout (requires authentication) */
router.get('/logout', ensureAuthenticated, authController.logout);
/** @route GET /user/profile - Displays user profile (requires authentication) */
router.get('/profile', ensureAuthenticated, authController.getProfile);

export default router;

