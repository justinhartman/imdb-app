/**
 * @module routes/auth
 * @description Express router configuration for authentication routes including login, registration,
 * logout, and profile management. All routes are prefixed with '/user'.
 */

import { Router } from 'express';
import authController from '../controllers/authController';
import { ensureAuthenticated } from '../middleware/auth';
import dbSessionMiddleware from '../middleware/dbSession';

const router = Router();

dbSessionMiddleware(router);

/** 
 * @route GET /user/login
 * @description Displays the login form 
 */
router.get('/login', authController.getLogin);

/** 
 * @route POST /user/login
 * @description Processes the login request.
 */
router.post('/login', authController.postLogin);

/** 
 * @route GET /user/register
 * @description Displays the registration form.
 */
router.get('/register', authController.getRegister);

/** 
 * @route POST /user/register
 * @description Processes the registration request.
 */
router.post('/register', authController.postRegister);

/** 
 * @route GET /user/logout
 * @description Handles user logout (requires authentication).
 */
router.get('/logout', ensureAuthenticated, authController.logout);

/** 
 * @route GET /user/profile
 * @description Displays user profile (requires authentication).
 */
router.get('/profile', ensureAuthenticated, authController.getProfile);

export default router;
