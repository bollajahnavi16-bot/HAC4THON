import express from 'express';
import { getDashboardMetrics } from '../controllers/metricsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, getDashboardMetrics);

export default router;
