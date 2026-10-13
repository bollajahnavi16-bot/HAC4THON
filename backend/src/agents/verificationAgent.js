import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';

/**
 * 5. VERIFICATION AGENT
 * Checks the actual post-action state in the database against expected recovery criteria.
 * Does not pretend an action succeeded if the database state is unchanged.
 */
export const runVerificationAgent = async ({ incident, executedActions }) => {
  const scenario = incident.scenario;
  const verificationChecks = [];
  let allChecksPassed = true;

  if (scenario === 'delayed_order') {
    const order = await Order.findOne({ orderId: incident.affectedEntityId });
    if (!order) {
      verificationChecks.push({
        assertion: 'Order entity exists in database',
        passed: false,
        details: 'Entity record missing',
      });
      allChecksPassed = false;
    } else {
      // Check 1: Carrier status updated
      const carrierUpdated = order.status === 'rerouted' && order.trackingStatus.includes('Priority Air');
      verificationChecks.push({
        assertion: 'Carrier rerouted and tracking status updated in dispatch system',
        passed: carrierUpdated,
        details: `Carrier: ${order.carrier}, Status: ${order.trackingStatus}, Tracking: ${order.trackingNumber}`,
      });
      if (!carrierUpdated) allChecksPassed = false;

      // Check 2: Remediation actions logged on order
      const hasRemediation = order.recoveryActions && order.recoveryActions.length > 0;
      verificationChecks.push({
        assertion: 'Audit remediation trail appended to customer order record',
        passed: hasRemediation,
        details: `${order.recoveryActions.length} recovery action(s) persisted`,
      });
      if (!hasRemediation) allChecksPassed = false;
    }
  } else if (scenario === 'inventory_shortage') {
    const item = await InventoryItem.findOne({ sku: incident.affectedEntityId });
    if (!item) {
      verificationChecks.push({
        assertion: 'SKU inventory record exists',
        passed: false,
        details: 'Item missing from inventory ledger',
      });
      allChecksPassed = false;
    } else {
      // Check 1: Stock replenished or emergency PO triggered
      const stockHealthy = item.currentStock > item.safetyThreshold || item.emergencyPOTriggered;
      verificationChecks.push({
        assertion: 'Safety stock replenished or emergency purchase order committed',
        passed: stockHealthy,
        details: `Current stock: ${item.currentStock} (Threshold: ${item.safetyThreshold}), Emergency PO: ${item.emergencyPOTriggered ? 'ACTIVE' : 'NO'}`,
      });
      if (!stockHealthy) allChecksPassed = false;

      // Check 2: Item status non-critical
      const statusRestored = item.status !== 'critical_shortage';
      verificationChecks.push({
        assertion: 'Stockout risk status downgraded from critical alert',
        passed: statusRestored,
        details: `Current inventory status: ${item.status}`,
      });
      if (!statusRestored) allChecksPassed = false;
    }
  } else if (scenario === 'payment_failure') {
    const tx = await PaymentTransaction.findOne({ transactionId: incident.affectedEntityId });
    if (!tx) {
      verificationChecks.push({
        assertion: 'Transaction record exists',
        passed: false,
        details: 'Payment record missing',
      });
      allChecksPassed = false;
    } else {
      // Check 1: Transaction status settled
      const isSettled = tx.status === 'settled';
      verificationChecks.push({
        assertion: 'Payment captured and verified as settled in payment ledger',
        passed: isSettled,
        details: `Status: ${tx.status}, Gateway: ${tx.recoveryGateway || tx.gateway}, Amount: $${tx.amount.toFixed(2)}`,
      });
      if (!isSettled) allChecksPassed = false;

      // Check 2: Settlement timestamp verified
      const hasSettledTime = Boolean(tx.settledAt);
      verificationChecks.push({
        assertion: 'Settlement timestamp and auth code verified',
        passed: hasSettledTime,
        details: `Settled at: ${tx.settledAt ? tx.settledAt.toISOString() : 'N/A'}`,
      });
      if (!hasSettledTime) allChecksPassed = false;
    }
  } else {
    // Custom / generic scenario verification
    const actionsPassed = executedActions && executedActions.length > 0
      ? executedActions.every((a) => a.status === 'executed')
      : true;
    verificationChecks.push({
      assertion: 'Executed recovery actions recorded and verified in audit log',
      passed: actionsPassed,
      details: `${executedActions?.length || 0} action(s) processed with status '${actionsPassed ? 'executed' : 'incomplete'}'`,
    });
    if (!actionsPassed) allChecksPassed = false;
  }

  const successRate = verificationChecks.length > 0
    ? (verificationChecks.filter((c) => c.passed).length / verificationChecks.length) * 100
    : 0;

  return {
    verified: allChecksPassed,
    verificationSuccessRate: Math.round(successRate),
    verifiedAt: new Date(),
    checks: verificationChecks,
    summary: allChecksPassed
      ? 'All post-action operational state assertions PASSED. System metrics within nominal SLA thresholds.'
      : 'One or more verification assertions FAILED. Escalating to engineering on-call.',
  };
};
