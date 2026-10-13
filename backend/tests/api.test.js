import assert from 'node:assert';
import http from 'node:http';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/seed/seedRunner.js';
import { app } from '../src/server.js';
import { User } from '../src/models/User.js';
import { Incident } from '../src/models/Incident.js';
import { startWorkflow } from '../src/agents/orchestrator.js';

let server;
let port;
let authToken;

const makeRequest = ({ path, method = 'GET', body = null, token = null }) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  console.log('\n--- STARTING AGENTOPS AI AUTOMATED INTEGRATION TESTS ---');

  try {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await seedDatabase({ reset: true });

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
    console.log(`[Test Server] Running on dynamic test port ${port}`);

    // TEST 1: Health check
    console.log('\n[TEST 1] Verifying /api/health endpoint...');
    const health = await makeRequest({ path: '/api/health' });
    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.data.status, 'ONLINE');
    console.log('✓ Health check passed!');

    // TEST 2: User Login
    console.log('\n[TEST 2] Verifying User Authentication (Login)...');
    const loginRes = await makeRequest({
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: 'admin@agentops.ai',
        password: 'Admin@123456',
      },
    });
    assert.strictEqual(loginRes.statusCode, 200);
    assert.ok(loginRes.data.token, 'Token must be present in response');
    authToken = loginRes.data.token;
    console.log('✓ Login passed! Bearer token acquired.');

    // TEST 3: Fetch Incidents
    console.log('\n[TEST 3] Verifying Protected /api/incidents endpoint...');
    const incidentsRes = await makeRequest({
      path: '/api/incidents',
      token: authToken,
    });
    assert.strictEqual(incidentsRes.statusCode, 200);
    assert.ok(incidentsRes.data.count >= 3, 'Must have at least 3 seeded demo incidents');
    console.log(`✓ Fetched ${incidentsRes.data.count} seeded demo incidents!`);

    // TEST 4: Fetch Dashboard Metrics
    console.log('\n[TEST 4] Verifying /api/metrics/dashboard real DB calculation...');
    const metricsRes = await makeRequest({
      path: '/api/metrics/dashboard',
      token: authToken,
    });
    assert.strictEqual(metricsRes.statusCode, 200);
    assert.ok(metricsRes.data.data.kpis.totalIncidents >= 3);
    assert.strictEqual(metricsRes.data.data.scenarios.length, 3);
    console.log('✓ Real metrics calculated and validated successfully!');

    // TEST 5: Orchestrator Workflow Run
    console.log('\n[TEST 5] Testing Multi-Agent Orchestrator Pipeline...');
    const testIncident = await Incident.findOne({ scenario: 'delayed_order' });
    assert.ok(testIncident, 'Test incident must exist');

    const workflowRun = await startWorkflow({
      incidentId: testIncident._id,
      triggeredBy: 'Automated Test Runner',
    });
    assert.ok(workflowRun, 'Workflow run initialized');
    assert.strictEqual(workflowRun.steps.length, 6, 'Must initialize exactly 6 agent steps');
    console.log('✓ Multi-Agent Orchestrator launched with 6 structured agent steps!');

    // Allow background pipeline steps 0-2 to run
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log('\n=======================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (5/5)');
    console.log('=======================================================\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Execution Failed:', err);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runTests();
