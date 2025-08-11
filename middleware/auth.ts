import { Response, NextFunction } from 'express';

/** Ensure the user is authenticated */
export const ensureAuthenticated = (
  req: any,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated()) return next();
  res.redirect('/user/login');
};

