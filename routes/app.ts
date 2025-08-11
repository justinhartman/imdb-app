import { Router } from 'express';
import appController from '../controllers/appController';

const router = Router();

router.get('/', appController.getHome);
router.get('/view/:id/:type', appController.getView);
router.get('/view/:id/:type/:season/:episode', appController.getView);
router.get('/search', appController.getSearch);

export default router;

