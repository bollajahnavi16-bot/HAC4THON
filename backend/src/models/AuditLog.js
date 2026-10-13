import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      required: true,
      unique: true,
    },
    actionType: {
      type: String,
      required: true,
    },
    actorType: {
      type: String,
      enum: ['agent', 'user', 'system'],
      required: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    incidentCode: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outcome: {
      type: String,
      enum: ['success', 'failure', 'warning', 'info'],
      default: 'success',
    },
    verificationHash: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
