import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
    },
    incidentCode: {
      type: String,
      required: true,
    },
    workflowRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowRun',
      required: true,
    },
    actionId: {
      type: String,
      required: true,
    },
    actionName: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      required: true,
    },
    targetEntity: {
      type: String,
      required: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    blastRadius: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
    },
    riskScore: {
      type: Number,
      default: 75,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    decidedAt: {
      type: Date,
    },
    decidedBy: {
      type: String,
      default: null,
    },
    decisionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Approval = mongoose.model('Approval', approvalSchema);
