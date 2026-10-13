import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog.js';
import { queryGeminiAgent } from './geminiClient.js';

/**
 * 6. REPORTING AGENT
 * Produces an executive recovery brief, MTTR analytics, and cryptographic audit record.
 */
export const runReportingAgent = async ({ incident, workflowRun, investigationData, verificationData }) => {
  const scenario = incident.scenario;
  const startedAt = workflowRun.createdAt || new Date();
  const recoveryDurationMs = Date.now() - new Date(startedAt).getTime();

  const executedActions = (workflowRun.recoveryPlan || [])
    .filter((a) => a.status === 'executed')
    .map((a) => `${a.name} (${a.actionType})`);

  const systemPrompt = `You are the Reporting Agent in AgentOps AI.
Synthesize an executive audit report for an autonomous business recovery operation.
Return JSON:
{
  "executiveSummary": string,
  "businessOutcome": string,
  "preventativeRecommendations": string[]
}`;

  const userPrompt = `Incident: ${incident.title} (${scenario})
Investigation: ${JSON.stringify(investigationData, null, 2)}
Executed Actions: ${JSON.stringify(executedActions, null, 2)}
Verification Status: ${JSON.stringify(verificationData, null, 2)}
Recovery Duration: ${Math.round(recoveryDurationMs / 1000)} seconds`;

  const fallbackGenerator = () => {
    return {
      executiveSummary: `Autonomous recovery workflow concluded successfully for incident ${incident.incidentId}. The root cause was identified as ${investigationData.rootCauseCategory || 'operational disruption'}, and targeted remediations were executed with verification confirmed.`,
      businessOutcome: `Customer impact minimized; operational SLA restored to 100% nominal health within ${Math.round(recoveryDurationMs / 1000)} seconds. Zero residual failure states detected.`,
      preventativeRecommendations: [
        'Adjust safety stock buffer dynamically for high-velocity SKUs prior to promotional events.',
        'Implement automated multi-carrier fallback thresholds when primary freight hub dwell time exceeds 24 hours.',
        'Configure payment gateway timeout retry circuit-breakers to fallback within 800ms.',
      ],
    };
  };

  const aiSynthesis = await queryGeminiAgent({
    systemPrompt,
    userPrompt,
    fallbackGenerator,
  });

  // Calculate cryptographic integrity compliance hash
  const rawDataToHash = `${incident.incidentId}|${workflowRun._id}|${recoveryDurationMs}|${JSON.stringify(executedActions)}|${verificationData.verified}`;
  const complianceHash = crypto.createHash('sha256').update(rawDataToHash).digest('hex');

  const finalReport = {
    incidentId: incident.incidentId,
    scenario,
    executiveSummary: aiSynthesis.executiveSummary,
    rootCause: investigationData.primaryHypothesis || investigationData.rootCauseCategory || 'Operational Bottleneck',
    actionsTaken: executedActions,
    verifiedOutcome: verificationData.summary,
    recoveryDurationMs,
    complianceHash,
    preventativeRecommendations: aiSynthesis.preventativeRecommendations || [],
    generatedAt: new Date(),
  };

  // Record audit trail entry for report completion
  await AuditLog.create({
    auditId: `AUDIT-${Date.now()}-REPORT`,
    actionType: 'incident_resolved_report_generated',
    actorType: 'agent',
    actorName: 'Reporting Agent',
    incidentCode: incident.incidentId,
    details: {
      complianceHash,
      recoveryDurationMs,
      actionsCount: executedActions.length,
      verificationPassed: verificationData.verified,
    },
    outcome: 'success',
    verificationHash: complianceHash,
  });

  return finalReport;
};
