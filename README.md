# AgentOps AI — Autonomous Business Recovery Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend: Node.js / Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](backend)
[![Frontend: React / Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-cyan.svg)](frontend)
[![AI Engine: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-violet.svg)](https://ai.google.dev/)
[![Database: MongoDB Mongoose](https://img.shields.io/badge/Database-MongoDB%20%7C%20In--Memory%20Fallback-emerald.svg)](backend/src/config/db.js)

**AgentOps AI** is an enterprise-grade autonomous operations platform that detects business disruptions, investigates root causes using Google Gemini AI, plans recovery operations, executes allowlisted remediations with human-in-the-loop governance, verifies post-action states against real database records, and generates cryptographic compliance audit trails.

---

## 🎯 Problem & Solution Overview

### The Problem
Operational disruptions cost enterprises millions of dollars in lost revenue, customer churn, and manual triage overhead. Incident responders waste hours manually querying logs, checking warehouse stock, escalating across logistics channels, and validating outcomes.

### The AgentOps AI Solution
An autonomous multi-agent operational platform that automates the full recovery lifecycle:
1. **Detects** business anomalies across e-commerce orders, inventory, and payment gateways.
2. **Investigates** evidence and identifies root causes using Gemini AI.
3. **Plans** optimal, risk-scored remediation sequences.
4. **Governs** high-blast-radius decisions with human-in-the-loop approvals.
5. **Executes** strictly allowlisted actions on operational databases with simulated business environment fidelity.
6. **Verifies** post-execution states against real operational assertions.
7. **Audits** all actions with cryptographic signatures (SHA-256) and executive briefings.

---

## 🤖 The 6 Core AI Agents

| # | Agent Name | Primary Responsibility | Output Artifact |
|---|------------|------------------------|-----------------|
| **1** | **Monitor Agent** | Continuously scans operational records (Orders, Inventory, Payments) to detect SLA breaches and anomalies. | Telemetry health metrics & anomaly register. |
| **2** | **Investigation Agent** | Synthesizes logs, carrier dwell times, supplier backlogs, and processor errors using Google Gemini AI. | Root cause diagnosis, confidence score (%), and evidentiary facts. |
| **3** | **Planning Agent** | Formulates prioritized recovery actions, enforces allowlists, calculates risk scores (0–100), and flags consequential approvals. | Multi-step recovery plan with blast radius assessment. |
| **4** | **Action Agent** | Deterministically executes allowlisted backend functions (`reroute_carrier`, `issue_store_credit`, `trigger_emergency_po`, etc.). | Real database state mutations with execution latency logs. |
| **5** | **Verification Agent** | Inspects post-execution database records to confirm SLA resolution. Never fakes success. | Pass/fail assertions and verification success rate. |
| **6** | **Reporting Agent** | Synthesizes an executive brief, SLA MTTR analytics, and an immutable SHA-256 compliance hash. | Compliance audit record & executive summary. |

---

## 📦 Initial Demo Scenarios

1. **Delayed E-Commerce Orders (`delayed_order`)**:
   - *Incident*: VIP Order #ORD-9821 stalled at Memphis sorting hub for >36 hours due to weather.
   - *Plan*: Priority Air re-routing (`reroute_carrier`) + Customer goodwill store credit voucher (`issue_store_credit`) + Transactional email dispatch (`send_customer_apology`).
   - *Verification*: Carrier updated to DHL Express Air, status marked `rerouted`.

2. **Inventory Shortages (`inventory_shortage`)**:
   - *Incident*: High-demand Enterprise GPU Module (SKU: COMP-GPU-H100) stock fell to 8 units (73% below 30-unit safety threshold).
   - *Plan*: Cross-dock transfer from regional warehouse (`reallocate_warehouse_stock`) + Expedited supplier emergency purchase order (`trigger_emergency_po`).
   - *Human Gate*: Consequential purchase order commitment ($127,500) triggers **Approval Queue** gate.
   - *Verification*: Safety stock restored above threshold, emergency PO marked active.

3. **Payment Failures (`payment_failure`)**:
   - *Incident*: High-value checkout payment transaction #TX-PAY-7741 ($1,499.00) timed out on primary Stripe gateway.
   - *Plan*: Clear fraud quarantine false positive (`unblock_checkout_session`) + Failover routing via secondary Adyen processor (`retry_payment_gateway`).
   - *Verification*: Transaction status settled in ledger with authorization code.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Recharts, Lucide Icons, Axios.
- **Backend**: Node.js v24, Express.js REST API.
- **Authentication**: JWT Bearer tokens, bcryptjs password hashing.
- **Validation**: Zod schema validation.
- **Persistence**: MongoDB with Mongoose (with automated **zero-setup In-Memory MongoDB Server fallback**).
- **AI Brain**: Google Gemini API (`@google/generative-ai`) with offline-resilient heuristic reasoning backup.
- **Security**: Strict allowlist of permissible actions, human authorization threshold for high blast-radius actions.

---

## 🚀 Quickstart Guide for Beginners

### Prerequisites
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed on your machine.

### Step 1: Clone and Navigate
```bash
cd "agentops-ai"
```

### Step 2: Configure Environment Variables (Optional)
The backend is pre-configured with secure development defaults and an embedded in-memory MongoDB instance.

If you have a Google Gemini API key or external MongoDB URI, create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=agentops_super_secret_jwt_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=
AUTO_APPROVE_THRESHOLD=low
```
> **Note**: If `GEMINI_API_KEY` is omitted, the platform automatically activates its high-fidelity deterministic heuristic reasoning engine, guaranteeing that live hackathon demos never crash or fail due to network or rate limits!

---

### Step 3: Run the Application

You can start the backend and frontend in separate terminals:

#### Terminal 1 — Start Backend Server
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` (automatically seeds demo data).*

#### Terminal 2 — Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔑 Demo Login Credentials

You can use the convenient **1-Click Demo Sign-in buttons** on the login page or enter these credentials:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@agentops.ai` | `Admin@123456` | Full platform control & governance |
| **Operator** | `operator@agentops.ai` | `Operator@123456` | Incident triage & workflow approval |

---

## 🧪 Automated Testing

AgentOps AI includes an automated integration test suite validating:
- Health check endpoints
- JWT authentication & bcrypt validation
- Incident management and live database calculations
- Multi-agent orchestrator 6-step initialization and execution

Run the tests:
```bash
cd backend
npm test
```

---

## 📂 Project Architecture

```
agentops-ai/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (MongoDB + MemoryServer fallback), env.js
│   │   ├── models/          # User, Incident, BusinessRecord, WorkflowRun, Approval, AuditLog, SystemConfig
│   │   ├── middleware/      # auth (JWT), validate (Zod), errorHandler
│   │   ├── routes/          # auth, incidents, workflows, approvals, audit, metrics, settings
│   │   ├── controllers/     # Business logic & database mutations
│   │   ├── agents/          # 6 Agents: monitor, investigation, planning, action, verification, reporting, orchestrator
│   │   ├── seed/            # Demo data & seed runner script
│   │   └── server.js        # Express app entry point
│   ├── tests/
│   │   └── api.test.js      # Automated backend integration tests
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Navbar, Sidebar, MetricCard, StatusBadge, Modal, EmptyState, Loader
│   │   │   ├── layout/      # AppLayout, ProtectedRoute
│   │   │   └── workflow/    # WorkflowTimeline, AgentStepCard, LiveTerminal
│   │   ├── context/         # AuthContext, AppContext (badges, toasts)
│   │   ├── pages/           # Login, Register, Dashboard, Incidents, IncidentDetail, WorkflowVisualizer, Approvals, AuditLogs, Analytics, Settings
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # Route configuration
│   │   └── index.css        # Enterprise dark navy theme & animations
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ARCHITECTURE.md          # Architectural blueprints and diagrams
└── README.md                # Project documentation and quickstart
```

---

## 🛡️ Security Model

1. **Strict Allowlist**: The Action Agent only accepts supported backend functions (`ALLOWED_ACTION_TYPES`). Arbitrary code execution is strictly prohibited.
2. **Human-in-the-Loop Gate**: Consequential actions exceeding the risk threshold (or classified with High Blast Radius) are paused until an authorized operator approves them.
3. **No Secret Leaks**: Gemini API keys and JWT secrets are confined exclusively to the backend.
4. **Input Validation**: All requests are sanitized and validated with Zod schemas.
5. **Audit Integrity**: Every action records an immutable audit log entry sealed with a SHA-256 hash.

---

## 🏆 Hackathon Demo Walkthrough (3 Minutes)

1. **Sign In**: Navigate to `http://localhost:5173/login` and click **Admin Role**.
2. **Review Dashboard**: Notice the live operational metrics, MTTR tracking, and the 3 core business scenarios.
3. **Trigger Workflow**: Click **Run Agents** on **INC-2026-002** (Critical Stockout Alert).
4. **Watch Multi-Agent DAG**:
   - Monitor Agent flags the deficit.
   - Investigation Agent pinpoints supplier backlog.
   - Planning Agent creates an allowlisted recovery sequence.
   - High-risk action (`trigger_emergency_po`) pauses at the **Human Authorization Gate**.
5. **Authorize Action**: Navigate to **Approval Queue**, review the Blast Radius meter, and click **Authorize & Resume Pipeline**.
6. **Verify Resolution**: Watch the Action Agent execute the re-route/PO, the Verification Agent assert the post-action database state, and the Reporting Agent emit the cryptographic audit signature.
7. **Review Analytics**: Navigate to **Analytics & SLA** to view charts and click **Export Executive Brief**!
