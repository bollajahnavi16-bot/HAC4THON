import { z } from 'zod';
import { Incident } from '../models/Incident.js';
import { WorkflowRun } from '../models/WorkflowRun.js';
import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';
import { startWorkflow } from '../agents/orchestrator.js';
import { runMonitorAgent } from '../agents/monitorAgent.js';

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    scenario: z.enum(['delayed_order', 'inventory_shortage', 'payment_failure', 'custom']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    affectedEntityId: z.string().min(1, 'Affected Entity ID is required'),
    affectedEntityType: z.enum(['Order', 'InventoryItem', 'PaymentTransaction']),
    summary: z.string().optional().default(''),
  }),
});

export const getIncidents = async (req, res, next) => {
  try {
    const { scenario, severity, status, search } = req.query;
    const filter = {};

    if (scenario && scenario !== 'all') filter.scenario = scenario;
    if (severity && severity !== 'all') filter.severity = severity;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { incidentId: { $regex: search, $options: 'i' } },
        { affectedEntityId: { $regex: search, $options: 'i' } },
      ];
    }

    const incidents = await Incident.find(filter)
      .populate('activeWorkflowRunId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (err) {
    next(err);
  }
};

export const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('activeWorkflowRunId');
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    // Fetch entity record
    let entityData = null;
    if (incident.affectedEntityType === 'Order') {
      entityData = await Order.findOne({ orderId: incident.affectedEntityId });
    } else if (incident.affectedEntityType === 'InventoryItem') {
      entityData = await InventoryItem.findOne({ sku: incident.affectedEntityId });
    } else if (incident.affectedEntityType === 'PaymentTransaction') {
      entityData = await PaymentTransaction.findOne({ transactionId: incident.affectedEntityId });
    }

    res.json({
      success: true,
      data: {
        incident,
        entityData,
      },
    });
  } catch (err) {
    next(err);
  }
};

const generateUniqueIncidentId = async () => {
  const timestamp = Date.now().toString().slice(-4);
  const rand = Math.floor(100 + Math.random() * 900);
  let id = `INC-2026-${timestamp}${rand}`;
  while (await Incident.exists({ incidentId: id })) {
    const nextRand = Math.floor(100 + Math.random() * 900);
    id = `INC-2026-${Date.now().toString().slice(-4)}${nextRand}`;
  }
  return id;
};

export const createIncident = async (req, res, next) => {
  try {
    const { title, scenario, severity, affectedEntityId, affectedEntityType, summary } = req.body;
    const incidentId = await generateUniqueIncidentId();

    const incident = await Incident.create({
      incidentId,
      title,
      scenario,
      severity,
      affectedEntityId,
      affectedEntityType,
      summary,
      status: 'open',
    });

    res.status(201).json({
      success: true,
      data: incident,
    });
  } catch (err) {
    next(err);
  }
};

export const triggerWorkflow = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const triggeredBy = req.user ? req.user.name : 'Operator Console';
    const workflowRun = await startWorkflow({
      incidentId: incident._id,
      triggeredBy,
    });

    res.json({
      success: true,
      message: 'AgentOps AI Recovery Workflow initialized',
      workflowRunId: workflowRun._id,
    });
  } catch (err) {
    next(err);
  }
};

export const scanAndDiscover = async (req, res, next) => {
  try {
    const monitorResult = await runMonitorAgent();
    const newlyCreated = [];

    for (const anomaly of monitorResult.anomalies) {
      const existing = await Incident.findOne({
        affectedEntityId: anomaly.entityId,
        status: { $nin: ['resolved', 'stopped'] },
      });

      if (!existing) {
        const incidentId = await generateUniqueIncidentId();
        const inc = await Incident.create({
          incidentId,
          title: anomaly.title,
          scenario: anomaly.scenario,
          severity: anomaly.severity,
          status: 'open',
          riskScore: anomaly.riskScore,
          affectedEntityId: anomaly.entityId,
          affectedEntityType: anomaly.entityType,
          summary: anomaly.summary,
        });
        newlyCreated.push(inc);
      }
    }

    res.json({
      success: true,
      message: `Monitor scan detected ${monitorResult.totalAnomaliesDetected} issues. ${newlyCreated.length} new incident(s) registered.`,
      newlyCreatedCount: newlyCreated.length,
      anomalies: monitorResult.anomalies,
    });
  } catch (err) {
    next(err);
  }
};
