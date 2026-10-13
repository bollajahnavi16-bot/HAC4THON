import express from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  triggerWorkflow,
  scanAndDiscover,
  createIncidentSchema,
} from '../controllers/incidentController.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getIncidents);
router.post('/scan', authenticate, scanAndDiscover);
router.post('/', authenticate, validateRequest(createIncidentSchema), createIncident);
router.get('/:id', authenticate, getIncidentById);
router.post('/:id/trigger', authenticate, triggerWorkflow);

export default router;
