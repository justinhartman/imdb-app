/**
 * @module routes/health
 * @description Express router providing health check endpoints.
 */

import { Router } from 'express';

import healthController from '../controllers/healthController';

const router = Router();

/**
 * @route GET /health/domains
 * @description Returns the health status of configured embed domains.
 */
router.get('/domains', healthController.getEmbedDomains);

/**
 * @route GET /health/app
 * @description Returns the health status of the application domain.
 */
router.get('/app', healthController.getAppUrl);

export default router;
