import express from 'express';
import { getApprovals, decideApproval, decideApprovalSchema } from '../controllers/approvalController.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getApprovals);
router.post('/:id/decide', authenticate, validateRequest(decideApprovalSchema), decideApproval);

export default router;
