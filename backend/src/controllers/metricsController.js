import { Incident } from '../models/Incident.js';
import { WorkflowRun } from '../models/WorkflowRun.js';
import { Approval } from '../models/Approval.js';
import { AuditLog } from '../models/AuditLog.js';
import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Incident Metrics
    const totalIncidents = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({
      status: { $nin: ['resolved', 'failed', 'stopped'] },
    });
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
    const stoppedOrFailed = await Incident.countDocuments({ status: { $in: ['failed', 'stopped'] } });

    const totalClosed = resolvedIncidents + stoppedOrFailed;
    const recoverySuccessRate = totalClosed > 0
      ? Math.round((resolvedIncidents / totalClosed) * 100)
      : (resolvedIncidents > 0 ? 100 : 0);

    // 2. MTTR Calculation from completed workflow runs
    const completedWorkflows = await WorkflowRun.find({
      status: 'completed',
      'finalReport.recoveryDurationMs': { $exists: true },
    }).select('finalReport.recoveryDurationMs');

    let avgMTTRSeconds = 0;
    if (completedWorkflows.length > 0) {
      const totalMs = completedWorkflows.reduce((sum, w) => sum + (w.finalReport?.recoveryDurationMs || 0), 0);
      avgMTTRSeconds = Math.round(totalMs / completedWorkflows.length / 1000);
    }

    // 3. Pending Approvals
    const pendingApprovalsCount = await Approval.countDocuments({ status: 'pending' });

    // 4. Autonomous Action Breakdown
    const agentActionsCount = await AuditLog.countDocuments({ actorType: 'agent' });
    const humanActionsCount = await AuditLog.countDocuments({ actorType: 'user' });

    // 5. Scenarios Breakdown
    const delayedOrderCount = await Incident.countDocuments({ scenario: 'delayed_order' });
    const inventoryShortageCount = await Incident.countDocuments({ scenario: 'inventory_shortage' });
    const paymentFailureCount = await Incident.countDocuments({ scenario: 'payment_failure' });

    // 6. Severity Breakdown
    const criticalCount = await Incident.countDocuments({ severity: 'critical' });
    const highCount = await Incident.countDocuments({ severity: 'high' });
    const mediumCount = await Incident.countDocuments({ severity: 'medium' });
    const lowCount = await Incident.countDocuments({ severity: 'low' });

    // 7. Operational business table counts
    const delayedOrdersCount = await Order.countDocuments({ status: 'delayed' });
    const criticalInventoryCount = await InventoryItem.countDocuments({ status: 'critical_shortage' });
    const failedPaymentsCount = await PaymentTransaction.countDocuments({ status: 'failed' });

    // 8. Recent Activity Feed
    const recentLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(6);

    res.json({
      success: true,
      data: {
        kpis: {
          totalIncidents,
          activeIncidents,
          resolvedIncidents,
          recoverySuccessRate,
          avgMTTRSeconds,
          pendingApprovalsCount,
          agentActionsCount,
          humanActionsCount,
          autonomousRatio: agentActionsCount + humanActionsCount > 0
            ? Math.round((agentActionsCount / (agentActionsCount + humanActionsCount)) * 100)
            : 0,
        },
        scenarios: [
          { name: 'Delayed E-Commerce Orders', count: delayedOrderCount, key: 'delayed_order', color: '#06B6D4' },
          { name: 'Inventory Shortages', count: inventoryShortageCount, key: 'inventory_shortage', color: '#8B5CF6' },
          { name: 'Payment Failures', count: paymentFailureCount, key: 'payment_failure', color: '#F43F5E' },
        ],
        severityDistribution: [
          { name: 'Critical', value: criticalCount, color: '#EF4444' },
          { name: 'High', value: highCount, color: '#F97316' },
          { name: 'Medium', value: mediumCount, color: '#F59E0B' },
          { name: 'Low', value: lowCount, color: '#10B981' },
        ],
        businessStatus: {
          delayedOrders: delayedOrdersCount,
          criticalInventory: criticalInventoryCount,
          failedPayments: failedPaymentsCount,
        },
        recentActivity: recentLogs,
      },
    });
  } catch (err) {
    next(err);
  }
};
