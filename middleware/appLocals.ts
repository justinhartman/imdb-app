/**
 * @module middleware/appLocals
 * @description Express middleware that populates commonly used view locals.
 */

import { NextFunction, Request, Response } from 'express';

import appConfig from '../config/app';
import { useAuth } from '../helpers/appHelper';

/**
 * Populates Express locals with application metadata used in views.
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object to populate with locals.
 * @param {NextFunction} next - Callback to invoke the next middleware in the chain.
 */
const appLocals = (_req: Request, res: Response, next: NextFunction): void => {
  res.locals.APP_NAME = appConfig.APP_NAME;
  res.locals.APP_SUBTITLE = appConfig.APP_SUBTITLE;
  res.locals.APP_DESCRIPTION = appConfig.APP_DESCRIPTION;
  res.locals.APP_URL = appConfig.APP_URL;
  res.locals.CARD_TYPE = useAuth ? 'card-add' : 'card';
  next();
};

export default appLocals;
