import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    scenario: {
      type: String,
      enum: ['delayed_order', 'inventory_shortage', 'payment_failure', 'custom'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'planning', 'pending_approval', 'executing', 'verifying', 'resolved', 'failed', 'stopped'],
      default: 'open',
    },
    blastRadius: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    affectedEntityId: {
      type: String,
      required: true,
    },
    affectedEntityType: {
      type: String,
      enum: ['Order', 'InventoryItem', 'PaymentTransaction'],
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    rootCause: {
      type: String,
      default: '',
    },
    activeWorkflowRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowRun',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Incident = mongoose.model('Incident', incidentSchema);
