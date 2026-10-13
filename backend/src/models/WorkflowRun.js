import mongoose from 'mongoose';

const workflowStepSchema = new mongoose.Schema({
  stepIndex: { type: Number, required: true },
  agentName: {
    type: String,
    enum: [
      'Monitor Agent',
      'Investigation Agent',
      'Planning Agent',
      'Action Agent',
      'Verification Agent',
      'Reporting Agent',
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'waiting_approval', 'completed', 'failed', 'skipped', 'stopped'],
    default: 'pending',
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  durationMs: { type: Number, default: 0 },
  inputPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  outputPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  logs: [
    {
      timestamp: { type: Date, default: Date.now },
      level: { type: String, enum: ['info', 'warn', 'error', 'success'], default: 'info' },
      message: { type: String, required: true },
    },
  ],
});

const recoveryActionSchema = new mongoose.Schema({
  actionId: { type: String, required: true },
  actionType: { type: String, required: true },
  name: { type: String, required: true },
  target: { type: String, required: true },
  parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  requiresApproval: { type: Boolean, default: false },
  isSimulated: { type: Boolean, default: true },
  blastRadius: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  status: {
    type: String,
    enum: ['pending', 'awaiting_approval', 'approved', 'rejected', 'executing', 'executed', 'failed', 'cancelled'],
    default: 'pending',
  },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  errorMessage: { type: String, default: null },
  executedAt: { type: Date },
});

const workflowRunSchema = new mongoose.Schema(
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
    scenario: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['running', 'paused_approval', 'completed', 'failed', 'stopped'],
      default: 'running',
    },
    currentStepIndex: {
      type: Number,
      default: 0,
    },
    steps: [workflowStepSchema],
    recoveryPlan: [recoveryActionSchema],
    pendingApprovalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Approval',
      default: null,
    },
    finalReport: {
      executiveSummary: String,
      rootCause: String,
      actionsTaken: [String],
      verifiedOutcome: String,
      recoveryDurationMs: Number,
      complianceHash: String,
      generatedAt: Date,
    },
    stoppedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const WorkflowRun = mongoose.model('WorkflowRun', workflowRunSchema);
