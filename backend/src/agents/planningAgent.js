import { queryGeminiAgent } from './geminiClient.js';
import { SystemConfig } from '../models/SystemConfig.js';

// Strict ALLOWLIST of supported operational actions
export const ALLOWED_ACTION_TYPES = [
  'reroute_carrier',
  'issue_store_credit',
  'send_customer_apology',
  'reallocate_warehouse_stock',
  'trigger_emergency_po',
  'retry_payment_gateway',
  'unblock_checkout_session',
];

/**
 * 3. PLANNING AGENT
 * Creates an optimal recovery plan with risk scoring and approval gates.
 */
export const runPlanningAgent = async ({ incident, investigationData, entityData }) => {
  const scenario = incident.scenario;

  // Fetch system risk threshold
  let riskThreshold = 60;
  try {
    const config = await SystemConfig.findOne({ key: 'global_config' });
    if (config) {
      riskThreshold = config.riskApprovalThreshold || 60;
    }
  } catch (err) {
    // default to 60
  }

  const systemPrompt = `You are the Planning Agent in AgentOps AI.
Design a prioritized, step-by-step business recovery plan.
IMPORTANT: You MUST ONLY select actions from this strict allowlist:
${JSON.stringify(ALLOWED_ACTION_TYPES)}

Format output as JSON:
{
  "strategySummary": string,
  "estimatedRecoveryMinutes": number,
  "overallRiskScore": number (0-100),
  "actions": [
    {
      "actionId": string (e.g. "ACT-01"),
      "actionType": string (must be in allowlist),
      "name": string,
      "target": string,
      "parameters": object,
      "blastRadius": "low" | "medium" | "high",
      "riskScore": number (0-100),
      "requiresApproval": boolean,
      "rationale": string
    }
  ]
}`;

  const userPrompt = `Incident: ${incident.title} (${scenario})
Investigation Findings: ${JSON.stringify(investigationData, null, 2)}
Entity Data: ${JSON.stringify(entityData, null, 2)}
Global Risk Approval Threshold: ${riskThreshold} (Actions with risk >= threshold MUST require approval)`;

  const safeEntity = entityData || {};

  const fallbackGenerator = () => {
    if (scenario === 'delayed_order') {
      const isVip = safeEntity.customerTier === 'VIP';
      return {
        strategySummary: 'Dual-path remediation: Expedited carrier reroute paired with VIP customer retention concession.',
        estimatedRecoveryMinutes: 25,
        overallRiskScore: isVip ? 72 : 55,
        actions: [
          {
            actionId: 'ACT-01',
            actionType: 'reroute_carrier',
            name: 'Expedited Priority Reroute to DHL Air Express',
            target: `Order #${safeEntity.orderId || incident.affectedEntityId}`,
            parameters: {
              orderId: safeEntity.orderId || incident.affectedEntityId,
              newCarrier: 'DHL Express Air',
              serviceLevel: 'Next-Day Priority',
              estimatedArrivalDeltaDays: -2,
            },
            blastRadius: 'high',
            riskScore: 78,
            requiresApproval: true, // Consequential logistics re-routing
            rationale: 'Reallocates freight to air courier; incurs differential shipping fee requiring operations authorization.',
          },
          {
            actionId: 'ACT-02',
            actionType: 'issue_store_credit',
            name: 'Proactive Customer Goodwill Store Credit',
            target: `Customer ${safeEntity.customerName || 'Account'}`,
            parameters: {
              orderId: safeEntity.orderId || incident.affectedEntityId,
              customerEmail: safeEntity.customerEmail || 'customer@enterprise.com',
              creditAmount: isVip ? 35.00 : 15.00,
              currency: 'USD',
            },
            blastRadius: 'medium',
            riskScore: 45,
            requiresApproval: false,
            rationale: 'Mitigates customer churn and preserves NPS before customer files ticket.',
          },
          {
            actionId: 'ACT-03',
            actionType: 'send_customer_apology',
            name: 'Automated Status Notification & Apology Dispatch',
            target: safeEntity.customerEmail || 'customer@enterprise.com',
            parameters: {
              recipient: safeEntity.customerEmail || 'customer@enterprise.com',
              subject: 'Update regarding your order delivery schedule',
              templateId: 'order_reroute_vip_notice',
            },
            blastRadius: 'low',
            riskScore: 20,
            requiresApproval: false,
            rationale: 'Maintains full customer transparency with updated live tracking URL.',
          },
        ],
      };
    } else if (scenario === 'inventory_shortage') {
      const sku = safeEntity.sku || incident.affectedEntityId;
      return {
        strategySummary: 'Immediate regional stock transfer supported by automated emergency supplier replenishment.',
        estimatedRecoveryMinutes: 40,
        overallRiskScore: 75,
        actions: [
          {
            actionId: 'ACT-01',
            actionType: 'reallocate_warehouse_stock',
            name: 'Cross-Dock Transfer from Regional DC-02',
            target: `SKU: ${sku}`,
            parameters: {
              sku,
              sourceWarehouse: 'East Coast DC-02',
              targetWarehouse: safeEntity.warehouseLocation || 'Central Fulfillment DC-01',
              transferQuantity: 25,
            },
            blastRadius: 'medium',
            riskScore: 50,
            requiresApproval: false,
            rationale: 'Replenishes active picking bins within 18 hours using internal network buffer.',
          },
          {
            actionId: 'ACT-02',
            actionType: 'trigger_emergency_po',
            name: 'Trigger Expedited Supplier Restock Purchase Order',
            target: `Supplier: ${safeEntity.supplierName || 'Apex Logistics'}`,
            parameters: {
              sku,
              quantity: 150,
              supplier: safeEntity.supplierName || 'Apex Logistics',
              budgetImpact: 150 * (safeEntity.unitCost || 45),
              expeditedFreight: true,
            },
            blastRadius: 'high',
            riskScore: 82,
            requiresApproval: true, // Consequential financial commitment > $5,000
            rationale: 'Generates legally binding commercial PO exceeding spending delegation threshold.',
          },
        ],
      };
    } else if (scenario === 'payment_failure') {
      const txId = safeEntity.transactionId || incident.affectedEntityId;
      return {
        strategySummary: 'Failover transaction retry through secondary processor and fraud lock clearance.',
        estimatedRecoveryMinutes: 8,
        overallRiskScore: 68,
        actions: [
          {
            actionId: 'ACT-01',
            actionType: 'unblock_checkout_session',
            name: 'Clear False-Positive Fraud Quarantine',
            target: `Session TX #${txId}`,
            parameters: {
              transactionId: txId,
              orderId: safeEntity.orderId || 'ORD-SYNC',
            },
            blastRadius: 'low',
            riskScore: 30,
            requiresApproval: false,
            rationale: 'Releases risk engine lock after validating biometric device fingerprint.',
          },
          {
            actionId: 'ACT-02',
            actionType: 'retry_payment_gateway',
            name: 'Secondary Gateway Failover Reroute (Adyen Direct)',
            target: `Transaction #${txId}`,
            parameters: {
              transactionId: txId,
              originalGateway: safeEntity.gateway || 'Stripe',
              fallbackGateway: 'Adyen',
              amount: safeEntity.amount || 249.99,
            },
            blastRadius: 'high',
            riskScore: 72,
            requiresApproval: true, // Re-submitting payment capture
            rationale: 'Reroutes customer payment capture through secondary payment processor.',
          },
        ],
      };
    } else {
      // custom scenario
      return {
        strategySummary: 'Autonomous operational mitigation protocol with human authorization safety gate.',
        estimatedRecoveryMinutes: 15,
        overallRiskScore: 65,
        actions: [
          {
            actionId: 'ACT-01',
            actionType: 'send_customer_apology',
            name: 'Automated Stakeholder Incident Advisory',
            target: incident.affectedEntityId || 'Service Operational Channel',
            parameters: {
              recipient: 'ops-lead@enterprise.com',
              subject: `Automated remediation initiated for ${incident.title}`,
              incidentId: incident.incidentId,
            },
            blastRadius: 'low',
            riskScore: 20,
            requiresApproval: false,
            rationale: 'Dispatches incident advisory communication across operational stakeholder channel.',
          },
          {
            actionId: 'ACT-02',
            actionType: 'unblock_checkout_session',
            name: 'Service Flow Unblock and Session Reset',
            target: incident.affectedEntityId || 'Service Controller',
            parameters: {
              incidentId: incident.incidentId,
              entityType: incident.affectedEntityType,
              action: 'reset_operational_lock',
            },
            blastRadius: 'high',
            riskScore: 75,
            requiresApproval: true,
            rationale: 'Releases service lock and restarts operational flow; requires human operator sign-off.',
          },
        ],
      };
    }
  };

  const plan = await queryGeminiAgent({
    systemPrompt,
    userPrompt,
    fallbackGenerator,
  });

  // Strict Security Validation: Ensure every action is in the allowlist!
  const sanitizedActions = (plan.actions || []).map((action) => {
    if (!ALLOWED_ACTION_TYPES.includes(action.actionType)) {
      console.warn(`[PlanningAgent Security] Blocked unallowed action type: ${action.actionType}`);
      return null;
    }

    // Force approval if risk score >= threshold
    const requiresApproval =
      action.requiresApproval ||
      action.blastRadius === 'high' ||
      (action.riskScore || 0) >= riskThreshold;

    return {
      ...action,
      requiresApproval,
      isSimulated: true,
      status: 'pending',
    };
  }).filter(Boolean);

  return {
    strategySummary: plan.strategySummary,
    estimatedRecoveryMinutes: plan.estimatedRecoveryMinutes || 20,
    overallRiskScore: plan.overallRiskScore || 60,
    actions: sanitizedActions,
  };
};
