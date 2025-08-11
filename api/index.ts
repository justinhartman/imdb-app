/**
 * @module api
 * @description Main API module for the Binger App that initialises Express server and sets up middleware.
 * @author     Justin Hartman <code@justhart.com>
 * @copyright  Copyright (c) 2024-2025, Justin Hartman <https://justhart.com>
 * @link       https://binger.uk Binger UK
 * @license    MIT
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { inject } from '@vercel/analytics';

import appConfig from '../config/app';
import connectDB from '../config/db';
import { useAuth } from '../helpers/appHelper';
import appRouter from '../routes/app';
import authRouter from '../routes/auth';
import watchlistRouter from '../routes/watchlist';

/**
 * Express application instance.
 * @constant {express.Application}
 */
const app = express();

/** Load Vercel Analytics */
inject();

/**
 * Middleware function that sets the APP_URL as a local variable for the views.
 * @param {Request} req - The request object containing the HTTP request details.
 * @param {Response} res - The response object containing the HTTP response details.
 * @param {NextFunction} next - The next middleware function in the chain.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.APP_NAME = appConfig.APP_NAME;
  res.locals.APP_SUBTITLE = appConfig.APP_SUBTITLE;
  res.locals.APP_DESCRIPTION = appConfig.APP_DESCRIPTION;
  res.locals.APP_URL = appConfig.APP_URL;
  // We have different card types based on whether the app uses MongoDB or not.
  res.locals.CARD_TYPE = useAuth ? 'card-add' : 'card';
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

/**
 * Serves static files from the 'public' directory.
 * @param {string} path - The path to the directory containing the static files.
 */
app.use(express.static('public'));

/**
 * Load standard routes and conditionally use additional routes based on the value of useAuth boolean.
 * The method checks if MONGO_DB_URI is true then connects to MongoDB and uses additional middleware.
 */
app.use('/', appRouter);
// Test if MONGO_DB_URI is set.
if (useAuth) {
  // Connect to MongoDB instance.
  connectDB().catch((e: Error) => console.log(e.message));
  // Use additional routes.
  app.use('/user', authRouter);
  app.use('/watchlist', watchlistRouter);
}

/**
 * Starts the server and listens on the specified port.
 * @param {String} API_HOST - The host name on which the server will listen on.
 * @param {Number} API_PORT - The port number on which the server will listen on.
 * @returns {void} - No return value.
 */
app.listen(appConfig.API_PORT, appConfig.API_HOST, () => {
  console.log(`Server is running on http://${appConfig.API_HOST}:${appConfig.API_PORT}`);
});

export default app;
