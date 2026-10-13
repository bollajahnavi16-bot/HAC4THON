import { WorkflowRun } from '../models/WorkflowRun.js';
import { Incident } from '../models/Incident.js';
import { stopWorkflow, executePipeline } from '../agents/orchestrator.js';

export const getWorkflows = async (req, res, next) => {
  try {
    const workflows = await WorkflowRun.find()
      .populate('incidentId')
      .populate('pendingApprovalId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workflows.length,
      data: workflows,
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await WorkflowRun.findById(req.params.id)
      .populate('incidentId')
      .populate('pendingApprovalId');

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow run not found' });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
};

export const stopWorkflowHandler = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const workflow = await stopWorkflow({
      workflowRunId: req.params.id,
      reason: reason || 'Stopped via operator command',
    });

    res.json({
      success: true,
      message: 'Workflow successfully halted',
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
};

export const retryWorkflowHandler = async (req, res, next) => {
  try {
    const workflow = await WorkflowRun.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow run not found' });
    }

    workflow.status = 'running';
    workflow.stoppedReason = null;
    workflow.currentStepIndex = 0;
    if (workflow.steps && workflow.steps.length > 0) {
      workflow.steps.forEach((s) => {
        s.status = 'pending';
        s.logs = [];
      });
      workflow.markModified('steps');
    }
    await workflow.save();

    if (workflow.incidentId) {
      const incident = await Incident.findById(workflow.incidentId);
      if (incident) {
        incident.status = 'investigating';
        await incident.save();
      }
    }

    executePipeline(workflow._id).catch((err) => {
      console.error('[Workflow Retry Error]', err);
    });

    res.json({
      success: true,
      message: 'Workflow execution resumed',
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
};
