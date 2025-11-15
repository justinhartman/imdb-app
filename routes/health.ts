/**
 * @module routes/health
 * @description Express router providing health check endpoints for domain monitoring.
 */

import { Router } from 'express';
import healthController from '../controllers/healthController';

const router = Router();

/**
 * @route GET /health/vidsrc
 * @description Checks the health status of the VIDSRC_DOMAIN
 * @returns {DomainHealthResponse} JSON response with domain status
 */
router.get('/vidsrc', healthController.checkVidsrc);

/**
 * @route GET /health/multi
 * @description Checks the health status of the MULTI_DOMAIN
 * @returns {DomainHealthResponse} JSON response with domain status
 */
router.get('/multi', healthController.checkMulti);

/**
 * @route GET /health/app
 * @description Checks the health status of the APP_URL
 * @returns {DomainHealthResponse} JSON response with domain status
 */
router.get('/app', healthController.checkApp);

/**
 * @route GET /health/all
 * @description Checks the health status of all configured domains
 * @returns {Object} JSON response with all domain statuses and overall health
 */
router.get('/all', healthController.checkAll);

export default router;
