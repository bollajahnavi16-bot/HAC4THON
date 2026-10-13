import mongoose from 'mongoose';

// 1. E-Commerce Order Model
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerTier: { type: String, enum: ['Standard', 'Silver', 'Gold', 'VIP'], default: 'Standard' },
    itemName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    carrier: { type: String, default: 'FedEx Express' },
    trackingNumber: { type: String, default: '' },
    trackingStatus: { type: String, default: 'Label Created' },
    expectedDelivery: { type: Date, required: true },
    status: {
      type: String,
      enum: ['processing', 'in_transit', 'delayed', 'rerouted', 'delivered', 'cancelled'],
      default: 'processing',
    },
    delayReason: { type: String, default: '' },
    recoveryActions: [
      {
        actionType: String,
        appliedAt: { type: Date, default: Date.now },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

// 2. Inventory Item Model
const inventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Electronics' },
    warehouseLocation: { type: String, required: true },
    currentStock: { type: Number, required: true },
    safetyThreshold: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    supplierName: { type: String, default: 'Apex Component Logistics' },
    supplierLeadTimeDays: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['adequate', 'low_stock', 'critical_shortage', 'restock_ordered'],
      default: 'adequate',
    },
    emergencyPOTriggered: { type: Boolean, default: false },
    lastRestockDate: { type: Date },
  },
  { timestamps: true }
);

// 3. Payment Transaction Model
const paymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    gateway: { type: String, enum: ['Stripe', 'PayPal', 'Adyen'], default: 'Stripe' },
    status: {
      type: String,
      enum: ['pending', 'failed', 'retrying', 'settled', 'refunded'],
      default: 'pending',
    },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    retryCount: { type: Number, default: 0 },
    recoveryGateway: { type: String, default: '' },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
export const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
