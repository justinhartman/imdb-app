import { Router } from 'express';
import proxyController from '../controllers/proxyController';

/**
 * Router that exposes the reverse proxy endpoint used for sanitizing
 * third-party video pages before they are served to the client.
 */
const router = Router();

router.get('/', proxyController.fetchSanitized);

export default router;
