import { Router } from 'express';
import watchlistController from '../controllers/watchlistController';
import { ensureAuthenticated } from '../middleware/auth';
import dbSessionMiddleware from '../middleware/dbSession';

const router = Router();

dbSessionMiddleware(router);

router.get('/', ensureAuthenticated, watchlistController.getWatchlist);
router.post('/add', ensureAuthenticated, watchlistController.addToWatchlist);
router.post('/delete', ensureAuthenticated, watchlistController.deleteFromWatchlist);

export default router;

