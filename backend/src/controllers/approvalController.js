import { z } from 'zod';
import { Approval } from '../models/Approval.js';
import { resumeWorkflowAfterApproval } from '../agents/orchestrator.js';

export const decideApprovalSchema = z.object({
  body: z.object({
    approved: z.boolean(),
    decisionNotes: z.string().optional().default(''),
  }),
});

export const getApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const approvals = await Approval.find(filter)
      .populate('incidentId')
      .populate('workflowRunId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: approvals.length,
      data: approvals,
    });
  } catch (err) {
    next(err);
  }
};

export const decideApproval = async (req, res, next) => {
  try {
    const { approved, decisionNotes } = req.body;
    const approvalId = req.params.id;

    const decidedBy = req.user ? req.user.name : 'Operator Console';

    const updatedWorkflow = await resumeWorkflowAfterApproval({
      approvalId,
      approved,
      decidedBy,
      decisionNotes,
    });

    res.json({
      success: true,
      message: approved ? 'Action approved. Workflow execution resumed.' : 'Action rejected. Workflow aborted.',
      data: updatedWorkflow,
    });
  } catch (err) {
    next(err);
  }
};
