import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Order, InventoryItem, PaymentTransaction } from '../models/BusinessRecord.js';
import { Incident } from '../models/Incident.js';
import { WorkflowRun } from '../models/WorkflowRun.js';
import { Approval } from '../models/Approval.js';
import { AuditLog } from '../models/AuditLog.js';
import { SystemConfig } from '../models/SystemConfig.js';
import { demoUsers, demoOrders, demoInventory, demoPayments, demoIncidents } from './seedData.js';

export const seedDatabase = async ({ reset = false } = {}) => {
  console.log('[Seed] Checking database seeding state...');

  const userCount = await User.countDocuments();
  if (userCount > 0 && !reset) {
    console.log('[Seed] Database already initialized with operational data. Skipping re-seed.');
    return;
  }

  if (reset) {
    console.log('[Seed] Reset flag supplied. Purging existing database records...');
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      InventoryItem.deleteMany({}),
      PaymentTransaction.deleteMany({}),
      Incident.deleteMany({}),
      WorkflowRun.deleteMany({}),
      Approval.deleteMany({}),
      AuditLog.deleteMany({}),
      SystemConfig.deleteMany({}),
    ]);
  }

  console.log('[Seed] Inserting users with bcrypt hashed passwords...');
  for (const u of demoUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
    });
  }

  console.log('[Seed] Inserting demo operational records (Orders, Inventory, Payments)...');
  await Order.insertMany(demoOrders);
  await InventoryItem.insertMany(demoInventory);
  await PaymentTransaction.insertMany(demoPayments);

  console.log('[Seed] Creating demo incidents for the 3 core business scenarios...');
  await Incident.insertMany(demoIncidents);

  console.log('[Seed] Creating initial System Configuration...');
  await SystemConfig.create({
    key: 'global_config',
    autoApproveLowRisk: true,
    riskApprovalThreshold: 60,
    geminiModel: 'gemini-1.5-flash',
    simulatedLatencyMs: 400,
    auditLoggingStrict: true,
  });

  console.log('[Seed] Initializing initial baseline Audit Logs...');
  await AuditLog.create({
    auditId: `AUDIT-SYSTEM-INIT`,
    actionType: 'system_initialized',
    actorType: 'system',
    actorName: 'AgentOps Bootloader',
    details: {
      seedVersion: '1.0.0',
      demoScenariosLoaded: ['delayed_order', 'inventory_shortage', 'payment_failure'],
    },
    outcome: 'success',
  });

  console.log('[Seed] Seed sequence successfully completed!');
};

// If run directly from command line (npm run seed)
if (process.argv[1]?.endsWith('seedRunner.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase({ reset: true });
      console.log('Seeding finished successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}
