import { AuditLog } from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { actionType, actorType, outcome, search, limit = 50 } = req.query;
    const filter = {};

    if (actionType && actionType !== 'all') filter.actionType = actionType;
    if (actorType && actorType !== 'all') filter.actorType = actorType;
    if (outcome && outcome !== 'all') filter.outcome = outcome;
    if (search) {
      filter.$or = [
        { auditId: { $regex: search, $options: 'i' } },
        { incidentCode: { $regex: search, $options: 'i' } },
        { actorName: { $regex: search, $options: 'i' } },
        { actionType: { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
