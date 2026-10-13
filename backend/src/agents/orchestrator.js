import { WorkflowRun } from '../models/WorkflowRun.js';
import { Incident } from '../models/Incident.js';
import { Approval } from '../models/Approval.js';
import { AuditLog } from '../models/AuditLog.js';
import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';
import { runMonitorAgent } from './monitorAgent.js';
import { runInvestigationAgent } from './investigationAgent.js';
import { runPlanningAgent } from './planningAgent.js';
import { executeAction } from './actionAgent.js';
import { runVerificationAgent } from './verificationAgent.js';
import { runReportingAgent } from './reportingAgent.js';

// Helper to fetch entity data
const fetchEntityData = async (entityType, entityId) => {
  if (entityType === 'Order') {
    return Order.findOne({ orderId: entityId });
  } else if (entityType === 'InventoryItem') {
    return InventoryItem.findOne({ sku: entityId });
  } else if (entityType === 'PaymentTransaction') {
    return PaymentTransaction.findOne({ transactionId: entityId });
  }
  return null;
};

export const startWorkflow = async ({ incidentId, triggeredBy = 'System Trigger' }) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  // Define the 6 structured steps
  const initialSteps = [
    {
      stepIndex: 0,
      agentName: 'Monitor Agent',
      status: 'pending',
      logs: [],
    },
    {
      stepIndex: 1,
      agentName: 'Investigation Agent',
      status: 'pending',
      logs: [],
    },
    {
      stepIndex: 2,
      agentName: 'Planning Agent',
      status: 'pending',
      logs: [],
    },
    {
      stepIndex: 3,
      agentName: 'Action Agent',
      status: 'pending',
      logs: [],
    },
    {
      stepIndex: 4,
      agentName: 'Verification Agent',
      status: 'pending',
      logs: [],
    },
    {
      stepIndex: 5,
      agentName: 'Reporting Agent',
      status: 'pending',
      logs: [],
    },
  ];

  const workflowRun = await WorkflowRun.create({
    incidentId: incident._id,
    incidentCode: incident.incidentId,
    scenario: incident.scenario,
    status: 'running',
    currentStepIndex: 0,
    steps: initialSteps,
  });

  incident.activeWorkflowRunId = workflowRun._id;
  incident.status = 'investigating';
  await incident.save();

  await AuditLog.create({
    auditId: `AUDIT-${Date.now()}-START`,
    actionType: 'workflow_started',
    actorType: 'agent',
    actorName: 'Workflow Orchestrator',
    incidentCode: incident.incidentId,
    details: { workflowRunId: workflowRun._id, triggeredBy },
    outcome: 'info',
  });

  // Execute Steps asynchronously so caller gets immediate response, or await sequentially
  executePipeline(workflowRun._id).catch((err) => {
    console.error(`[Orchestrator Error] Execution pipeline failed:`, err);
  });

  return workflowRun;
};

export const executePipeline = async (workflowRunId) => {
  const workflowRun = await WorkflowRun.findById(workflowRunId);
  if (!workflowRun || workflowRun.status === 'stopped') return;

  const incident = await Incident.findById(workflowRun.incidentId);
  let entityData = await fetchEntityData(incident.affectedEntityType, incident.affectedEntityId);

  // ----------------------------------------------------
  // STEP 0: Monitor Agent
  // ----------------------------------------------------
  const step0 = workflowRun.steps[0];
  step0.status = 'in_progress';
  step0.startedAt = new Date();
  step0.logs.push({ timestamp: new Date(), level: 'info', message: 'Scanning live business metrics and operational logs...' });
  await workflowRun.save();

  const monitorResult = await runMonitorAgent();
  step0.completedAt = new Date();
  step0.durationMs = step0.completedAt - step0.startedAt;
  step0.status = 'completed';
  step0.outputPayload = monitorResult;
  step0.logs.push({
    timestamp: new Date(),
    level: 'success',
    message: `Monitor scan completed: detected ${monitorResult.totalAnomaliesDetected} active operational anomalies across systems.`,
  });
  workflowRun.currentStepIndex = 1;
  await workflowRun.save();

  // ----------------------------------------------------
  // STEP 1: Investigation Agent
  // ----------------------------------------------------
  const step1 = workflowRun.steps[1];
  step1.status = 'in_progress';
  step1.startedAt = new Date();
  step1.logs.push({ timestamp: new Date(), level: 'info', message: `Querying Gemini AI to isolate root cause for ${incident.title}...` });
  await workflowRun.save();

  const investigationResult = await runInvestigationAgent({ incident, entityData });
  step1.completedAt = new Date();
  step1.durationMs = step1.completedAt - step1.startedAt;
  step1.status = 'completed';
  step1.outputPayload = investigationResult;
  step1.logs.push({
    timestamp: new Date(),
    level: 'success',
    message: `Investigation diagnosis confirmed with ${investigationResult.confidenceScore}% confidence: ${investigationResult.rootCauseCategory}`,
  });
  workflowRun.currentStepIndex = 2;
  incident.rootCause = investigationResult.primaryHypothesis || investigationResult.rootCauseCategory;
  incident.summary = investigationResult.technicalDetails || incident.summary;
  await incident.save();
  await workflowRun.save();

  // ----------------------------------------------------
  // STEP 2: Planning Agent
  // ----------------------------------------------------
  const step2 = workflowRun.steps[2];
  step2.status = 'in_progress';
  step2.startedAt = new Date();
  step2.logs.push({ timestamp: new Date(), level: 'info', message: 'Synthesizing recovery strategy and evaluating action blast radius...' });
  await workflowRun.save();

  const planResult = await runPlanningAgent({ incident, investigationData: investigationResult, entityData });
  step2.completedAt = new Date();
  step2.durationMs = step2.completedAt - step2.startedAt;
  step2.status = 'completed';
  step2.outputPayload = planResult;
  step2.logs.push({
    timestamp: new Date(),
    level: 'success',
    message: `Plan constructed: ${planResult.actions.length} allowlisted actions formulated with risk score of ${planResult.overallRiskScore}/100.`,
  });

  workflowRun.recoveryPlan = planResult.actions;
  incident.riskScore = planResult.overallRiskScore;

  // Check if consequential action requires Human Approval
  const actionNeedingApproval = planResult.actions.find((a) => a.requiresApproval);
  if (actionNeedingApproval) {
    step2.logs.push({
      timestamp: new Date(),
      level: 'warn',
      message: `Consequential action "${actionNeedingApproval.name}" flagged for Human-in-the-Loop authorization (Blast Radius: ${actionNeedingApproval.blastRadius.toUpperCase()}). Pausing workflow.`,
    });

    const approval = await Approval.create({
      incidentId: incident._id,
      incidentCode: incident.incidentId,
      workflowRunId: workflowRun._id,
      actionId: actionNeedingApproval.actionId,
      actionName: actionNeedingApproval.name,
      actionType: actionNeedingApproval.actionType,
      targetEntity: actionNeedingApproval.target,
      parameters: actionNeedingApproval.parameters,
      blastRadius: actionNeedingApproval.blastRadius,
      riskScore: actionNeedingApproval.riskScore,
      reason: actionNeedingApproval.rationale || 'High blast radius operational modification',
      status: 'pending',
    });

    workflowRun.status = 'paused_approval';
    workflowRun.pendingApprovalId = approval._id;
    workflowRun.steps[3].status = 'waiting_approval';
    incident.status = 'pending_approval';

    await workflowRun.save();
    await incident.save();
    return; // PAUSED FOR HUMAN APPROVAL
  }

  // If no approval required, proceed directly through remaining steps
  await executeRemainingSteps(workflowRun, incident, investigationResult);
};

export const resumeWorkflowAfterApproval = async ({ approvalId, approved, decidedBy = 'Operations Manager', decisionNotes = '' }) => {
  const approval = await Approval.findById(approvalId);
  if (!approval) throw new Error('Approval record not found');

  approval.status = approved ? 'approved' : 'rejected';
  approval.decidedAt = new Date();
  approval.decidedBy = decidedBy;
  approval.decisionNotes = decisionNotes;
  await approval.save();

  const workflowRun = await WorkflowRun.findById(approval.workflowRunId);
  const incident = await Incident.findById(approval.incidentId);

  if (!approved) {
    // Rejected: Stop workflow safely
    workflowRun.status = 'stopped';
    workflowRun.stoppedReason = `Human operator rejected consequential action ${approval.actionName}: ${decisionNotes}`;
    workflowRun.steps[3].status = 'stopped';
    workflowRun.steps[3].logs.push({
      timestamp: new Date(),
      level: 'warn',
      message: `Action rejected by ${decidedBy}. Execution aborted by operator command.`,
    });
    incident.status = 'stopped';
    await workflowRun.save();
    await incident.save();

    await AuditLog.create({
      auditId: `AUDIT-${Date.now()}-REJECT`,
      actionType: 'action_rejected_by_human',
      actorType: 'user',
      actorName: decidedBy,
      incidentCode: incident.incidentId,
      details: { approvalId, actionName: approval.actionName, notes: decisionNotes },
      outcome: 'warning',
    });
    return workflowRun;
  }

  // Approved: Resume execution
  workflowRun.status = 'running';
  workflowRun.pendingApprovalId = null;
  incident.status = 'executing';
  await workflowRun.save();
  await incident.save();

  await AuditLog.create({
    auditId: `AUDIT-${Date.now()}-APPROVE`,
    actionType: 'action_approved_by_human',
    actorType: 'user',
    actorName: decidedBy,
    incidentCode: incident.incidentId,
    details: { approvalId, actionName: approval.actionName, notes: decisionNotes },
    outcome: 'success',
  });

  // Pull investigation data from Step 1 output
  const investigationResult = workflowRun.steps[1].outputPayload;

  // Run remaining steps
  await executeRemainingSteps(workflowRun, incident, investigationResult, decidedBy);
  return workflowRun;
};

const executeRemainingSteps = async (workflowRun, incident, investigationResult, decidedBy = null) => {
  // ----------------------------------------------------
  // STEP 3: Action Agent
  // ----------------------------------------------------
  const step3 = workflowRun.steps[3];
  step3.status = 'in_progress';
  step3.startedAt = new Date();
  step3.logs.push({ timestamp: new Date(), level: 'info', message: 'Executing allowlisted recovery actions through backend functions...' });
  workflowRun.currentStepIndex = 3;
  incident.status = 'executing';
  await workflowRun.save();
  await incident.save();

  const executedActionsRecord = [];
  for (const actionItem of workflowRun.recoveryPlan) {
    step3.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Invoking [${actionItem.actionType}] on target: ${actionItem.target}...`,
    });

    const execResult = await executeAction({
      action: actionItem,
      incidentCode: incident.incidentId,
      triggeredBy: decidedBy ? `Human Approved (${decidedBy})` : 'Action Agent',
    });

    actionItem.status = execResult.status;
    actionItem.result = execResult.result;
    actionItem.errorMessage = execResult.errorMessage;
    actionItem.executedAt = execResult.executedAt;

    executedActionsRecord.push(actionItem);

    step3.logs.push({
      timestamp: new Date(),
      level: execResult.status === 'executed' ? 'success' : 'error',
      message: execResult.status === 'executed'
        ? `Successfully executed "${actionItem.name}". State updated in database.`
        : `Execution failed for "${actionItem.name}": ${execResult.errorMessage}`,
    });
  }

  step3.completedAt = new Date();
  step3.durationMs = step3.completedAt - step3.startedAt;
  step3.status = 'completed';
  step3.outputPayload = { executedCount: executedActionsRecord.length, actions: executedActionsRecord };
  workflowRun.currentStepIndex = 4;
  workflowRun.markModified('recoveryPlan');
  workflowRun.markModified('steps');
  await workflowRun.save();

  // ----------------------------------------------------
  // STEP 4: Verification Agent
  // ----------------------------------------------------
  const step4 = workflowRun.steps[4];
  step4.status = 'in_progress';
  step4.startedAt = new Date();
  step4.logs.push({ timestamp: new Date(), level: 'info', message: 'Inspecting actual post-action database records and SLA assertions...' });
  workflowRun.currentStepIndex = 4;
  incident.status = 'verifying';
  await workflowRun.save();
  await incident.save();

  const verificationResult = await runVerificationAgent({ incident, executedActions: executedActionsRecord });
  step4.completedAt = new Date();
  step4.durationMs = step4.completedAt - step4.startedAt;
  step4.status = verificationResult.verified ? 'completed' : 'failed';
  step4.outputPayload = verificationResult;

  verificationResult.checks.forEach((chk) => {
    step4.logs.push({
      timestamp: new Date(),
      level: chk.passed ? 'success' : 'error',
      message: `Assertion [${chk.assertion}]: ${chk.passed ? 'PASSED' : 'FAILED'} - ${chk.details}`,
    });
  });

  workflowRun.currentStepIndex = 5;
  await workflowRun.save();

  // ----------------------------------------------------
  // STEP 5: Reporting Agent
  // ----------------------------------------------------
  const step5 = workflowRun.steps[5];
  step5.status = 'in_progress';
  step5.startedAt = new Date();
  step5.logs.push({ timestamp: new Date(), level: 'info', message: 'Generating executive recovery brief, MTTR analytics, and cryptographic audit hash...' });
  workflowRun.currentStepIndex = 5;
  await workflowRun.save();

  const finalReport = await runReportingAgent({
    incident,
    workflowRun,
    investigationData: investigationResult,
    verificationData: verificationResult,
  });

  step5.completedAt = new Date();
  step5.durationMs = step5.completedAt - step5.startedAt;
  step5.status = 'completed';
  step5.outputPayload = finalReport;
  step5.logs.push({
    timestamp: new Date(),
    level: 'success',
    message: `Audit report finalized. Cryptographic hash: ${finalReport.complianceHash.slice(0, 16)}... Incident resolved.`,
  });

  workflowRun.status = 'completed';
  workflowRun.finalReport = finalReport;
  incident.status = 'resolved';
  incident.resolvedAt = new Date();

  await workflowRun.save();
  await incident.save();
};

export const stopWorkflow = async ({ workflowRunId, reason = 'Manually stopped by operator' }) => {
  const workflowRun = await WorkflowRun.findById(workflowRunId);
  if (!workflowRun) throw new Error('Workflow not found');

  workflowRun.status = 'stopped';
  workflowRun.stoppedReason = reason;

  const currentStep = workflowRun.steps[workflowRun.currentStepIndex];
  if (currentStep && currentStep.status === 'in_progress') {
    currentStep.status = 'stopped';
    currentStep.logs.push({ timestamp: new Date(), level: 'warn', message: `Workflow stopped by operator: ${reason}` });
  }

  const incident = await Incident.findById(workflowRun.incidentId);
  if (incident) {
    incident.status = 'stopped';
    await incident.save();
  }

  await workflowRun.save();

  await AuditLog.create({
    auditId: `AUDIT-${Date.now()}-STOP`,
    actionType: 'workflow_stopped_by_user',
    actorType: 'user',
    actorName: 'Operator',
    incidentCode: workflowRun.incidentCode,
    details: { workflowRunId, reason },
    outcome: 'warning',
  });

  return workflowRun;
};
