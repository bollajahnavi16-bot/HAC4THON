import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_config',
    },
    autoApproveLowRisk: {
      type: Boolean,
      default: true,
    },
    riskApprovalThreshold: {
      type: Number,
      default: 60, // Actions with riskScore >= 60 require human approval
    },
    geminiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    simulatedLatencyMs: {
      type: Number,
      default: 400,
    },
    auditLoggingStrict: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
