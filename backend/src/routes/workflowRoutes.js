import express from 'express';
import {
  getWorkflows,
  getWorkflowById,
  stopWorkflowHandler,
  retryWorkflowHandler,
} from '../controllers/workflowController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getWorkflows);
router.get('/:id', authenticate, getWorkflowById);
router.post('/:id/stop', authenticate, stopWorkflowHandler);
router.post('/:id/retry', authenticate, retryWorkflowHandler);

export default router;
