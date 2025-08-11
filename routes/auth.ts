import { Router } from 'express';
import authController from '../controllers/authController';
import { ensureAuthenticated } from '../middleware/auth';
import dbSessionMiddleware from '../middleware/dbSession';

const router = Router();

dbSessionMiddleware(router);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);
router.get('/logout', ensureAuthenticated, authController.logout);
router.get('/profile', ensureAuthenticated, authController.getProfile);

export default router;

