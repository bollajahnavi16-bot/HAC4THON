import express from 'express';
import { getSettings, updateSettings, resetSeed } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);
router.post('/seed-reset', authenticate, resetSeed);

export default router;
