import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';
import { AuditLog } from '../models/AuditLog.js';
import crypto from 'crypto';

/**
 * 4. ACTION AGENT
 * Deterministic, allowlist-governed action execution engine with real database mutations
 * and simulated business environment fidelity.
 */
export const executeAction = async ({ action, incidentCode, triggeredBy = 'Action Agent' }) => {
  const { actionId, actionType, parameters = {} } = action;
  const executionStartTime = Date.now();

  try {
    let resultPayload = null;

    switch (actionType) {
      case 'reroute_carrier': {
        const { orderId, newCarrier = 'DHL Express Air', serviceLevel = 'Priority Air' } = parameters;
        const order = await Order.findOne({ orderId });
        if (!order) {
          throw new Error(`Order #${orderId} was not found in operational database.`);
        }

        const newTrackingNumber = `DHL-AIR-${Math.floor(10000000 + Math.random() * 90000000)}`;
        order.carrier = newCarrier;
        order.trackingNumber = newTrackingNumber;
        order.trackingStatus = 'Rerouted - Priority Air Transit';
        order.status = 'rerouted';
        order.recoveryActions.push({
          actionType: 'reroute_carrier',
          appliedAt: new Date(),
          details: {
            previousCarrier: 'FedEx Express',
            newCarrier,
            trackingNumber: newTrackingNumber,
            serviceLevel,
            simulated: true,
          },
        });
        await order.save();

        resultPayload = {
          success: true,
          simulated: true,
          orderId,
          newCarrier,
          trackingNumber: newTrackingNumber,
          status: 'rerouted',
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      case 'issue_store_credit': {
        const { orderId, customerEmail, creditAmount = 25.0 } = parameters;
        const voucherCode = `OPS-CREDIT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const order = await Order.findOne({ orderId });
        if (order) {
          order.recoveryActions.push({
            actionType: 'issue_store_credit',
            appliedAt: new Date(),
            details: { voucherCode, creditAmount, customerEmail, simulated: true },
          });
          await order.save();
        }

        resultPayload = {
          success: true,
          simulated: true,
          voucherCode,
          creditAmount,
          customerEmail,
          status: 'credit_issued',
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      case 'send_customer_apology': {
        const { recipient, subject = 'Important update regarding your delivery schedule' } = parameters;
        resultPayload = {
          success: true,
          simulated: true,
          recipient,
          subject,
          dispatchedVia: 'SendGrid Transactional Relay (Simulated)',
          deliveryReceiptId: `MSG-${Date.now()}`,
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      case 'reallocate_warehouse_stock': {
        const { sku, sourceWarehouse = 'DC-02', targetWarehouse = 'DC-01', transferQuantity = 25 } = parameters;
        const item = await InventoryItem.findOne({ sku });
        if (!item) {
          throw new Error(`Inventory Item SKU ${sku} was not found.`);
        }

        item.currentStock += Number(transferQuantity);
        if (item.currentStock > item.safetyThreshold) {
          item.status = 'adequate';
        }
        await item.save();

        resultPayload = {
          success: true,
          simulated: true,
          sku,
          transferredUnits: transferQuantity,
          from: sourceWarehouse,
          to: targetWarehouse,
          updatedCurrentStock: item.currentStock,
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      case 'trigger_emergency_po': {
        const { sku, quantity = 150, supplier = 'Apex Logistics' } = parameters;
        const poNumber = `PO-EMERGENCY-${Math.floor(100000 + Math.random() * 900000)}`;
        const item = await InventoryItem.findOne({ sku });
        if (item) {
          item.emergencyPOTriggered = true;
          item.status = 'restock_ordered';
          await item.save();
        }

        resultPayload = {
          success: true,
          simulated: true,
          poNumber,
          sku,
          quantity,
          supplier,
          estimatedFulfillmentDays: 2,
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      case 'retry_payment_gateway': {
        const { transactionId, fallbackGateway = 'Adyen' } = parameters;
        const tx = await PaymentTransaction.findOne({ transactionId });
        if (!tx) {
          throw new Error(`Payment transaction #${transactionId} was not found.`);
        }

        tx.status = 'settled';
        tx.recoveryGateway = fallbackGateway;
        tx.settledAt = new Date();
        tx.retryCount += 1;
        await tx.save();

        resultPayload = {
          success: true,
          simulated: true,
          transactionId,
          routingGateway: fallbackGateway,
          settledAmount: tx.amount,
          settlementStatus: 'settled',
          settlementAuthCode: `AUTH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      case 'unblock_checkout_session': {
        const { transactionId } = parameters;
        resultPayload = {
          success: true,
          simulated: true,
          transactionId,
          riskScoreNormalized: 12,
          sessionUnlocked: true,
          executionLatencyMs: Date.now() - executionStartTime,
        };
        break;
      }

      default:
        throw new Error(`Execution error: Action type "${actionType}" is not supported by Action Agent.`);
    }

    // Persist immutable Audit Log record
    const auditHash = crypto.createHash('sha256').update(JSON.stringify(resultPayload) + Date.now()).digest('hex');
    await AuditLog.create({
      auditId: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actionType,
      actorType: 'agent',
      actorName: triggeredBy,
      incidentCode,
      details: {
        actionId,
        parameters,
        result: resultPayload,
      },
      outcome: 'success',
      verificationHash: auditHash,
    });

    return {
      status: 'executed',
      result: resultPayload,
      errorMessage: null,
      executedAt: new Date(),
    };
  } catch (err) {
    console.error(`[ActionAgent Error] Failed executing action ${actionType}:`, err);

    await AuditLog.create({
      auditId: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actionType,
      actorType: 'agent',
      actorName: triggeredBy,
      incidentCode,
      details: { actionId, parameters, error: err.message },
      outcome: 'failure',
    });

    return {
      status: 'failed',
      result: null,
      errorMessage: err.message,
      executedAt: new Date(),
    };
  }
};
