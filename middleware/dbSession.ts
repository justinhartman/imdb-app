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
 * Database and Session middleware.
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

