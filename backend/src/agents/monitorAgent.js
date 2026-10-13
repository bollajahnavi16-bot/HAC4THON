import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';
import { Incident } from '../models/Incident.js';

/**
 * 1. MONITOR AGENT
 * Continuously polls stored operational records to identify business anomalies.
 */
export const runMonitorAgent = async () => {
  const anomalies = [];
  const now = new Date();

  // 1. Scan Delayed Orders
  const delayedOrders = await Order.find({
    $or: [
      { status: 'delayed' },
      { expectedDelivery: { $lt: now }, status: { $in: ['processing', 'in_transit'] } },
    ],
  });

  for (const order of delayedOrders) {
    anomalies.push({
      scenario: 'delayed_order',
      entityId: order.orderId,
      entityType: 'Order',
      severity: order.customerTier === 'VIP' ? 'critical' : 'high',
      riskScore: order.customerTier === 'VIP' ? 88 : 65,
      title: `E-Commerce Delivery Breach: Order #${order.orderId} (${order.customerTier})`,
      summary: `Order #${order.orderId} containing ${order.itemName} is delayed past SLA (${order.carrier} tracking stalled: ${order.trackingStatus}).`,
      details: {
        orderId: order.orderId,
        customerName: order.customerName,
        customerTier: order.customerTier,
        carrier: order.carrier,
        trackingStatus: order.trackingStatus,
        delayReason: order.delayReason || 'Regional sorting facility backlog',
      },
    });
  }

  // 2. Scan Inventory Shortages
  const inventoryDeficits = await InventoryItem.find({
    $expr: { $lte: ['$currentStock', '$safetyThreshold'] },
    status: { $in: ['adequate', 'low_stock', 'critical_shortage'] },
  });

  for (const item of inventoryDeficits) {
    const isCritical = item.currentStock <= item.safetyThreshold * 0.4;
    anomalies.push({
      scenario: 'inventory_shortage',
      entityId: item.sku,
      entityType: 'InventoryItem',
      severity: isCritical ? 'critical' : 'high',
      riskScore: isCritical ? 92 : 70,
      title: `Critical Inventory Stockout Risk: ${item.name} (${item.sku})`,
      summary: `Warehouse ${item.warehouseLocation} has ${item.currentStock} units remaining (safety threshold: ${item.safetyThreshold}). Stockout imminent.`,
      details: {
        sku: item.sku,
        name: item.name,
        warehouse: item.warehouseLocation,
        currentStock: item.currentStock,
        safetyThreshold: item.safetyThreshold,
        supplierName: item.supplierName,
        supplierLeadTimeDays: item.supplierLeadTimeDays,
      },
    });
  }

  // 3. Scan Payment Failures
  const failedTransactions = await PaymentTransaction.find({
    status: 'failed',
  });

  for (const tx of failedTransactions) {
    anomalies.push({
      scenario: 'payment_failure',
      entityId: tx.transactionId,
      entityType: 'PaymentTransaction',
      severity: tx.amount > 500 ? 'high' : 'medium',
      riskScore: tx.amount > 500 ? 78 : 58,
      title: `Payment Settlement Failure: TX #${tx.transactionId} ($${tx.amount.toFixed(2)})`,
      summary: `Payment transaction #${tx.transactionId} failed via ${tx.gateway} gateway with error code [${tx.errorCode}]: ${tx.errorMessage}.`,
      details: {
        transactionId: tx.transactionId,
        orderId: tx.orderId,
        customerName: tx.customerName,
        gateway: tx.gateway,
        amount: tx.amount,
        errorCode: tx.errorCode,
        errorMessage: tx.errorMessage,
        retryCount: tx.retryCount,
      },
    });
  }

  return {
    scannedAt: new Date(),
    totalAnomaliesDetected: anomalies.length,
    anomalies,
    healthOverview: {
      totalDelayedOrders: delayedOrders.length,
      totalInventoryDeficits: inventoryDeficits.length,
      totalPaymentFailures: failedTransactions.length,
      systemStatus: anomalies.length === 0 ? 'HEALTHY' : anomalies.length > 3 ? 'DEGRADED' : 'WARNING',
    },
  };
};
