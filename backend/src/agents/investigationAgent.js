import { queryGeminiAgent } from './geminiClient.js';
import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';

/**
 * 2. INVESTIGATION AGENT
 * Analyzes operational context and identifies evidence-based root causes using Gemini AI.
 */
export const runInvestigationAgent = async ({ incident, entityData }) => {
  const scenario = incident.scenario;

  const systemPrompt = `You are the Investigation Agent in an autonomous enterprise operations platform (AgentOps AI).
Your objective is to examine telemetry, logs, and business metrics for an active incident and diagnose the root cause with evidence-based reasoning.
Return a structured JSON output with:
{
  "rootCauseCategory": string,
  "confidenceScore": number (50-99),
  "primaryHypothesis": string,
  "evidence": string[],
  "businessImpact": {
    "financialRisk": string,
    "customerExperienceRisk": string,
    "slaBreachMinutes": number
  },
  "technicalDetails": string
}`;

  const userPrompt = `Incident Scenario: ${scenario}
Entity Type: ${incident.affectedEntityType}
Entity ID: ${incident.affectedEntityId}
Severity: ${incident.severity}
Incident Title: ${incident.title}
Operational Telemetry: ${JSON.stringify(entityData, null, 2)}`;

  const safeEntity = entityData || {};

  // Fallback heuristic diagnostic generator
  const fallbackGenerator = () => {
    if (scenario === 'delayed_order') {
      return {
        rootCauseCategory: 'carrier_sorting_hub_congestion',
        confidenceScore: 94,
        primaryHypothesis: `Regional carrier hub bottleneck at ${safeEntity.carrier || 'FedEx'} sorting facility caused parcel transit stall exceeding 36 hours beyond SLA.`,
        evidence: [
          `Tracking status stalled at "${safeEntity.trackingStatus || 'In Hub'}" for >36 hours.`,
          `High-value recipient (${safeEntity.customerTier || 'VIP'} tier) experiencing delivery SLA breach.`,
          `Alternative priority logistics channel (DHL Express Air) available with 99.2% on-time performance.`,
        ],
        businessImpact: {
          financialRisk: '$120 churn risk + SLA penalty',
          customerExperienceRisk: 'Severe risk of VIP customer cancellation and churn',
          slaBreachMinutes: 2160,
        },
        technicalDetails: `Hub telemetry indicates 34% surge in regional parcel volume resulting in automated routing hold.`,
      };
    } else if (scenario === 'inventory_shortage') {
      const stock = safeEntity.currentStock ?? 12;
      const threshold = safeEntity.safetyThreshold ?? 50;
      return {
        rootCauseCategory: 'supplier_lead_time_spike_and_demand_surge',
        confidenceScore: 91,
        primaryHypothesis: `Current stock level (${stock} units) fallen below minimum safety threshold (${threshold} units) due to unforecasted promo surge and supplier fulfillment backlog.`,
        evidence: [
          `Stock count of ${stock} units is under critical safety threshold of ${threshold}.`,
          `Supplier ${safeEntity.supplierName || 'Apex Logistics'} standard lead time is ${safeEntity.supplierLeadTimeDays || 5} days, exceeding remaining stock runway.`,
          `Secondary warehouse (East Coast DC-02) holds surplus units that can be cross-dock transferred within 18 hours.`,
        ],
        businessImpact: {
          financialRisk: '$14,200 lost GMV over next 72 hours if stockout occurs',
          customerExperienceRisk: 'Backorder delays across checkout carts',
          slaBreachMinutes: 0,
        },
        technicalDetails: `Inventory burn-rate accelerated versus historical baseline.`,
      };
    } else if (scenario === 'payment_failure') {
      const amount = safeEntity.amount ?? 249.99;
      return {
        rootCauseCategory: 'gateway_webhook_timeout_and_fraud_filter_false_positive',
        confidenceScore: 89,
        primaryHypothesis: `Primary payment gateway (${safeEntity.gateway || 'Stripe'}) experienced TLS handshake latency timeout, triggering an erroneous transient decline response [${safeEntity.errorCode || 'GATEWAY_TIMEOUT'}].`,
        evidence: [
          `Payment processor returned error code "${safeEntity.errorCode || 'GATEWAY_TIMEOUT'}": ${safeEntity.errorMessage || 'Upstream gateway unresponsive'}.`,
          `Cart value of $${amount} flagged by conservative risk filter false positive.`,
          `Secondary gateway (Adyen Global Direct) operating at 100% nominal latency (<180ms).`,
        ],
        businessImpact: {
          financialRisk: `$${amount} immediate transaction loss`,
          customerExperienceRisk: 'Frustrated checkout abandonment',
          slaBreachMinutes: 15,
        },
        technicalDetails: `Gateway socket timeout at 5000ms threshold; customer authorization remains valid for secondary routing retry.`,
      };
    } else {
      // custom or generic scenario
      return {
        rootCauseCategory: 'operational_anomaly_detected',
        confidenceScore: 88,
        primaryHypothesis: `Diagnostic investigation detected operational variance in ${incident.affectedEntityType || 'service'} [${incident.affectedEntityId || 'N/A'}] requiring recovery remediation.`,
        evidence: [
          `Telemetry shows discrepancy matching incident signature: ${incident.title || 'Operational Anomaly'}.`,
          `Automated telemetry metrics exceed established operational thresholds.`,
        ],
        businessImpact: {
          financialRisk: 'Operational throughput disruption',
          customerExperienceRisk: 'Degraded operational SLA',
          slaBreachMinutes: 30,
        },
        technicalDetails: `Telemetry analysis confirms active incident state across affected entity.`,
      };
    }
  };

  const investigationResults = await queryGeminiAgent({
    systemPrompt,
    userPrompt,
    fallbackGenerator,
  });

  return investigationResults;
};
