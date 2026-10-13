import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seedRunner.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'AgentOps AI — Autonomous Business Recovery Platform',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/settings', settingsRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Server Bootstrapping
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase({ reset: false });

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 AgentOps AI Platform Backend running on port ${env.PORT}`);
      console.log(`🔗 API Base: http://localhost:${env.PORT}/api`);
      console.log(`🛡️  Mode: ${env.NODE_ENV} | Auth: JWT + Bcrypt`);
      console.log(`🤖 Multi-Agent Orchestrator: Monitor -> Investigate -> Plan -> Action -> Verify -> Report`);
      console.log(`=======================================================`);
    });

    return { app, server };
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
};

// Start server when run directly (node src/server.js)
if (process.argv[1]?.endsWith('server.js')) {
  startServer();
}

export { app, startServer };
