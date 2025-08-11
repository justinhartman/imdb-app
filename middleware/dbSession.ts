/**
 * @module middleware/dbSession
 * @description Handles database session management middleware setup.
 */

import { Router } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import flash from 'connect-flash';
import passport from 'passport';
import MongoStore from 'connect-mongo';

import appConfig from '../config/app';
import passportConfig from '../config/passport';

passportConfig(passport);

/**
 * Configures and sets up database session and authentication middleware.
 *
 * @description Sets up session management, flash messages, and Passport authentication
 * using MongoDB as the session store. Configures body parsing for URL-encoded data
 * and initializes passport authentication.
 *
 * @param {Router} router - Express Router instance to attach middleware to
 * @returns {void} Nothing is returned
 *
 * @example
 * // Use in Express application setup
 * const router = express.Router();
 * dbSessionMiddleware(router);
 */
const dbSessionMiddleware = (router: Router): void => {
  if (appConfig.MONGO_DB_URI === '') return;

  router.use(bodyParser.urlencoded({ extended: false }));

  router.use(
    session({
      secret: `${appConfig.APP_SECRET}`,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: appConfig.MONGO_DB_URI,
        dbName: appConfig.MONGO_DB_NAME,
      }),
    })
  );

  router.use(flash());

  router.use((req: any, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

  router.use(passport.initialize());
  router.use(passport.session());
};

export default dbSessionMiddleware;
