/**
 * User authentication middleware.
 * @module middleware/auth
 * @description This module exports a middleware function that ensures the user is authenticated.
 */

/**
 * @function ensureAuthenticated
 * @description This middleware function checks if the user is authenticated. If the user is authenticated,
 *              it allows the request to proceed. If not, it redirects the user to the login page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {void} - This function does not return a value.
 */
module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  },
};
