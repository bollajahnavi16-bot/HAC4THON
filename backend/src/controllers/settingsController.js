import mongoose from 'mongoose';
import { SystemConfig } from '../models/SystemConfig.js';
import { isGeminiConfigured } from '../agents/geminiClient.js';
import { seedDatabase } from '../seed/seedRunner.js';

export const getSettings = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne({ key: 'global_config' });
    if (!config) {
      config = await SystemConfig.create({
        key: 'global_config',
        autoApproveLowRisk: true,
        riskApprovalThreshold: 60,
        geminiModel: 'gemini-1.5-flash',
        simulatedLatencyMs: 400,
        auditLoggingStrict: true,
      });
    }

    const isConnectedMongo = mongoose.connection.readyState === 1;

    res.json({
      success: true,
      data: {
        config,
        systemHealth: {
          server: 'ONLINE',
          uptimeSeconds: Math.round(process.uptime()),
          nodeVersion: process.version,
          database: {
            status: isConnectedMongo ? 'CONNECTED' : 'DISCONNECTED',
            name: mongoose.connection.name || 'agentops-ai',
            host: mongoose.connection.host || 'embedded-in-memory',
          },
          geminiAI: {
            configured: isGeminiConfigured(),
            model: config.geminiModel,
            fallbackModeActive: !isGeminiConfigured(),
            modeDescription: isGeminiConfigured()
              ? 'Google Gemini 1.5 Flash Connected & Active'
              : 'Deterministic Heuristic Fallback Engine Active (Offline Resilient)',
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { autoApproveLowRisk, riskApprovalThreshold, simulatedLatencyMs } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { key: 'global_config' },
      {
        ...(autoApproveLowRisk !== undefined && { autoApproveLowRisk }),
        ...(riskApprovalThreshold !== undefined && { riskApprovalThreshold: Number(riskApprovalThreshold) }),
        ...(simulatedLatencyMs !== undefined && { simulatedLatencyMs: Number(simulatedLatencyMs) }),
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      data: config,
    });
  } catch (err) {
    next(err);
  }
};

export const resetSeed = async (req, res, next) => {
  try {
    await seedDatabase({ reset: true });
    res.json({
      success: true,
      message: 'Database operational demo dataset successfully reset to initial state',
    });
  } catch (err) {
    next(err);
  }
};
