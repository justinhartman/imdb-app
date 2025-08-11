/**
 * @module middleware/auth
 * @description Handles authentication middleware.
 */

import { Response, NextFunction } from 'express';

/**
 * Middleware to ensure user authentication status.
 *
 * @description Checks if the user is authenticated using Passport.js isAuthenticated() method.
 * If authenticated, allows the request to proceed to the next middleware/route handler.
 * If not authenticated, redirects the user to the login page.
 *
 * @param {any} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void} Calls next() if authenticated, redirects to login if not
 *
 * @example
 * // Use as middleware in route
 * router.get('/protected', ensureAuthenticated, (req, res) => {
 *   // Only authenticated users can access this route
 * });
 */
const ensureAuthenticated = (
  req: any,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated()) return next();
  res.redirect('/user/login');
};

export { ensureAuthenticated };
