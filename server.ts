import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_METRICS,
  INITIAL_PRECOMPUTED_TUNINGS,
  INITIAL_SESSIONS,
  INITIAL_SLOW_QUERIES,
  INITIAL_TABLESPACES,
  INITIAL_WAIT_EVENTS,
} from './src/data/mockOracleData.js';
import {
  INITIAL_OSCAP_RULES,
  INITIAL_VAPT_SUMMARY,
} from './src/data/mockSecurityData.js';
import {
  ExplainPlanStep,
  OracleMetric,
  OracleSession,
  OscapRule,
  SlowQuery,
  TablespaceInfo,
  TerminalExecutionResult,
  TuningAuditEntry,
  TuningRecommendation,
  VaptScanSummary,
  WaitEvent,
} from './src/types/oracle.js';
import {
  AgentExecutionTrace,
  LangChainAgentStep,
  LocalLlmConfig,
  RagDocumentChunk,
} from './src/types/llm.js';
import {
  INITIAL_RAG_KNOWLEDGE_BASE,
  searchRagKnowledge,
} from './src/data/mockRagKnowledge.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-memory state
let currentMetrics: OracleMetric = { ...INITIAL_METRICS };
let waitEvents: WaitEvent[] = [...INITIAL_WAIT_EVENTS];
let activeSessions: OracleSession[] = [...INITIAL_SESSIONS];
let tablespaces: TablespaceInfo[] = [...INITIAL_TABLESPACES];
let slowQueries: SlowQuery[] = [...INITIAL_SLOW_QUERIES];
let tuningHistory: Record<string, TuningRecommendation> = { ...INITIAL_PRECOMPUTED_TUNINGS };
let auditLog: TuningAuditEntry[] = [...INITIAL_AUDIT_LOG];
let oscapRules: OscapRule[] = INITIAL_OSCAP_RULES.map(r => ({ ...r }));
let vaptSummary: VaptScanSummary = { ...INITIAL_VAPT_SUMMARY };

// Lead Model & Local LLM Configuration State
let localLlmConfig: LocalLlmConfig = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  modelName: 'llama3.2:latest',
  isLead: true,
  temperature: 0.2,
  maxTokens: 4096,
  topP: 0.9,
  systemInstruction: 'You are the Lead Oracle DBA Agent powered by LangChain tool calling and RAG retrieval over Oracle 19c documentation.',
  isConnected: true,
  latencyMs: 24,
  lastChecked: new Date().toISOString(),
};

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Periodic realistic metric jitter
setInterval(() => {
  const cpuJitter = (Math.random() - 0.5) * 4;
  const bufferJitter = (Math.random() - 0.5) * 0.8;
  const sessionJitter = Math.floor((Math.random() - 0.5) * 3);

  currentMetrics = {
    ...currentMetrics,
    timestamp: new Date().toISOString(),
    cpuUtilization: Math.min(98, Math.max(25, Number((currentMetrics.cpuUtilization + cpuJitter).toFixed(1)))),
    bufferCacheHitRatio: Math.min(99.9, Math.max(85, Number((currentMetrics.bufferCacheHitRatio + bufferJitter).toFixed(1)))),
    activeSessions: Math.max(12, currentMetrics.activeSessions + sessionJitter),
    iops: Math.max(5000, Math.floor(currentMetrics.iops + (Math.random() - 0.5) * 600)),
    dbTimeRate: Number((Math.max(1.5, currentMetrics.dbTimeRate + (Math.random() - 0.5) * 0.4)).toFixed(1)),
  };
}, 4000);

// --- API ROUTES ---

// 1. Live Performance Metrics
app.get('/api/dba/metrics', (_req: Request, res: Response) => {
  res.json({
    metrics: currentMetrics,
    status: currentMetrics.cpuUtilization > 85 ? 'CRITICAL' : currentMetrics.cpuUtilization > 75 ? 'WARNING' : 'HEALTHY',
  });
});

// 2. Wait Events (ASH Top Events)
app.get('/api/dba/wait-events', (_req: Request, res: Response) => {
  res.json({ waitEvents });
});

// 3. Tablespace Storage
app.get('/api/dba/tablespaces', (_req: Request, res: Response) => {
  res.json({ tablespaces });
});

// 4. Active Sessions & Lock Graph
app.get('/api/dba/sessions', (_req: Request, res: Response) => {
  res.json({ sessions: activeSessions });
});

// 5. Kill session (ALTER SYSTEM KILL SESSION)
app.post('/api/dba/kill-session', (req: Request, res: Response) => {
  const { sid, serial } = req.body;
  const sessionIdx = activeSessions.findIndex((s) => s.sid === Number(sid));
  if (sessionIdx !== -1) {
    const killedSession = activeSessions[sessionIdx];
    activeSessions.splice(sessionIdx, 1);

    // Release any blocked sessions
    activeSessions = activeSessions.map((s) => {
      if (s.blockingSid === Number(sid)) {
        return {
          ...s,
          blockingSid: undefined,
          event: 'SQL*Net message from client',
          waitClass: 'Idle',
          secondsInWait: 0,
        };
      }
      return s;
    });

    // Adjust TX row lock event
    waitEvents = waitEvents.map((w) => {
      if (w.eventName.includes('row lock contention')) {
        return {
          ...w,
          percentageDbTime: Math.max(2, w.percentageDbTime - 14),
          severity: 'normal',
        };
      }
      return w;
    });

    auditLog.unshift({
      id: `audit-${Date.now()}`,
      sqlId: killedSession.sqlId || 'N/A',
      recommendationId: 'KILL_SESSION',
      executedBy: 'DBA_OPERATOR',
      executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actionType: 'QUERY_REWRITE',
      executedCommands: [`ALTER SYSTEM KILL SESSION '${sid},${serial}' IMMEDIATE;`],
      rollbackCommand: '-- Session termination cannot be rolled back',
      status: 'SUCCESS',
      executionTimeMs: 140,
      measuredImprovementPct: 100,
      notes: `Terminated blocker SID ${sid} (${killedSession.username}). Unblocked waiting sessions.`,
    });

    res.json({ success: true, message: `Session ${sid},${serial} killed successfully.` });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// 6. Slow Queries List
app.get('/api/dba/slow-queries', (_req: Request, res: Response) => {
  res.json({ slowQueries });
});

// 7. Audit Log
app.get('/api/dba/audit-log', (_req: Request, res: Response) => {
  res.json({ auditLog });
});

// 8. Workload Simulator
app.post('/api/dba/simulate-workload', (req: Request, res: Response) => {
  const { scenario } = req.body;
  if (scenario === 'HIGH_LOCK_CONTENTION') {
    currentMetrics.cpuUtilization = 89.4;
    currentMetrics.activeSessions = 58;
    currentMetrics.bufferCacheHitRatio = 88.2;

    activeSessions.unshift({
      sid: 409,
      serial: 29401,
      username: 'PAYMENTS_GATEWAY',
      status: 'ACTIVE',
      osUser: 'pay_srv01',
      machine: 'pay-gateway-01.corp',
      program: 'PaymentProcessorDaemon',
      sqlId: '8f7q2m8x9p31a',
      event: 'enq: TX - row lock contention',
      waitClass: 'Application',
      secondsInWait: 240,
      blockingSid: 142,
      cpuTimeMs: 68400,
      logonTime: new Date().toLocaleTimeString(),
    });

    waitEvents = waitEvents.map((w) =>
      w.eventName.includes('row lock contention')
        ? { ...w, percentageDbTime: 38.5, severity: 'critical' }
        : w
    );
  } else if (scenario === 'SLOW_TABLE_SCAN_SPIKE') {
    currentMetrics.cpuUtilization = 94.8;
    currentMetrics.bufferCacheHitRatio = 79.4;
    currentMetrics.iops = 22400;

    waitEvents = waitEvents.map((w) =>
      w.eventName.includes('db file sequential read')
        ? { ...w, percentageDbTime: 58.2, severity: 'critical' }
        : w
    );
  } else if (scenario === 'NORMAL') {
    currentMetrics.cpuUtilization = 48.2;
    currentMetrics.bufferCacheHitRatio = 98.7;
    currentMetrics.activeSessions = 24;
    waitEvents = [...INITIAL_WAIT_EVENTS];
  }

  res.json({ success: true, scenario, metrics: currentMetrics });
});

// 9. Explain Plan Generator
app.post('/api/dba/explain-plan', async (req: Request, res: Response) => {
  const { sqlQuery } = req.body;
  if (!sqlQuery) {
    return res.status(400).json({ error: 'sqlQuery is required' });
  }

  // Generate synthetic or Gemini-based Explain Plan steps
  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `Analyze this Oracle 19c SQL query and produce an estimated Oracle Execution Plan (Explain Plan) as a JSON array of step objects.
Query:
${sqlQuery}

Return JSON with format:
{
  "plan": [
    {
      "id": 0,
      "parentId": null,
      "operation": "SELECT STATEMENT",
      "options": null,
      "objectName": null,
      "cost": 45000,
      "cardinality": 10000,
      "bytes": 500000,
      "timeSec": 15.2,
      "accessPredicates": null,
      "filterPredicates": null,
      "warning": null
    }
  ]
}
Warning can be one of: FULL_TABLE_SCAN, CARTESIAN_JOIN, TEMP_SPILL, CARDINALITY_MISMATCH, HIGH_COST, or null.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.plan && Array.isArray(parsed.plan)) {
        return res.json({ plan: parsed.plan });
      }
    }
  } catch (err) {
    console.error('Gemini explain plan error:', err);
  }

  // Fallback heuristic plan
  const plan: ExplainPlanStep[] = [
    { id: 0, operation: 'SELECT STATEMENT', cost: 38400, cardinality: 12000, bytes: 960000, timeSec: 14.5 },
    { id: 1, parentId: 0, operation: 'HASH JOIN', cost: 38400, cardinality: 12000, bytes: 960000, timeSec: 14.5 },
    { id: 2, parentId: 1, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'MAIN_TABLE', cost: 28000, cardinality: 850000, bytes: 42500000, timeSec: 11.2, warning: 'FULL_TABLE_SCAN' },
    { id: 3, parentId: 1, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'LOOKUP_TABLE', cost: 10400, cardinality: 150000, bytes: 6000000, timeSec: 3.3, warning: 'FULL_TABLE_SCAN' },
  ];
  return res.json({ plan });
});

// 10. AI SQL Tuning Engine (Gemini 3.8 Flash)
app.post('/api/dba/tune-sql', async (req: Request, res: Response) => {
  const { sqlQuery, sqlId = `sql-${Date.now().toString(36)}`, parsingSchema = 'APP_USER', targetDb = 'PROD_RAC01' } = req.body;

  if (!sqlQuery || typeof sqlQuery !== 'string') {
    return res.status(400).json({ error: 'SQL query text is required' });
  }

  // Check if we already have precomputed high-fidelity analysis for this query ID
  if (sqlId && tuningHistory[sqlId]) {
    return res.json({ recommendation: tuningHistory[sqlId] });
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const systemInstruction = `You are an elite Oracle Database Administrator (DBA) & Cost-Based Optimizer (CBO) performance tuning specialist.
You specialize in Oracle 19c/21c SQL Tuning Advisor, AWR/ASH analysis, execution plan bottlenecks, indexing strategies, optimizer hints, DBMS_STATS, and SQL Plan Baselines (DBMS_SPM).

When given an Oracle SQL query:
1. Identify all performance bottlenecks (e.g. Full Table Scans suppressing indexes due to functions, Cartesian joins, unnested correlated subqueries, NOT IN with nullable columns, missing composite indexes, inefficient join orders, temporary tablespace sorts).
2. Rewrite the SQL query into an optimized, syntactically correct Oracle SQL query (with ANSI joins, subquery unnesting, CTEs, or window functions as appropriate).
3. Provide optimal Oracle Optimizer Hints (e.g., /*+ LEADING(...) USE_HASH(...) USE_NL(...) INDEX(...) GATHER_PLAN_STATISTICS */).
4. Provide production-ready DDL (CREATE INDEX ... TABLESPACE ... ONLINE COMPUTE STATISTICS). ONLINE is critical to prevent table locks.
5. Provide DBMS_STATS.GATHER_TABLE_STATS script.
6. Provide DBMS_SPM or DBMS_SQLTUNE script to pin the plan or create a baseline.
7. Provide an estimated before vs after metrics comparison (cost, buffer gets, elapsed time).
8. Detail the step-by-step DBA technical rationale.
9. Provide a comprehensive Risk Assessment (LOW/MEDIUM/HIGH, risk score 1-100, locking risk, and rollback plan).
10. Generate original and optimized Oracle Explain Plan steps.

You must respond ONLY with a valid JSON object matching the requested schema.`;

      const prompt = `Target Database: ${targetDb}
Schema: ${parsingSchema}
SQL ID: ${sqlId}
Original Oracle SQL Query:
${sqlQuery}

Analyze this query and return JSON with the following exact structure:
{
  "detectedIssues": ["issue 1", "issue 2", ...],
  "tuningRationale": "Detailed technical DBA explanation of WHY this improves performance...",
  "optimizedSql": "The rewritten Oracle SQL query formatted cleanly",
  "recommendedHints": ["/*+ ... */"],
  "recommendedDdl": ["CREATE INDEX ... ONLINE ...;"],
  "statisticsCommands": ["BEGIN DBMS_STATS.GATHER_TABLE_STATS(...); END; /"],
  "planBaselineCommand": "DECLARE ... DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(...) ... END; /",
  "sqlProfileScript": "BEGIN DBMS_SQLTUNE.ACCEPT_SQL_PROFILE(...) ... END; /",
  "metricsComparison": {
    "originalCost": 42000,
    "optimizedCost": 150,
    "costReductionPct": 99.6,
    "originalBufferGets": 2800000,
    "estimatedBufferGets": 5200,
    "bufferGetsReductionPct": 99.8,
    "originalElapsedSec": 14.8,
    "estimatedElapsedSec": 0.09,
    "elapsedReductionPct": 99.4
  },
  "originalPlan": [
    { "id": 0, "operation": "SELECT STATEMENT", "cost": 42000, "cardinality": 10000, "bytes": 500000, "timeSec": 14.8 },
    { "id": 1, "parentId": 0, "operation": "TABLE ACCESS", "options": "FULL", "objectName": "TABLE_NAME", "cost": 42000, "cardinality": 10000, "bytes": 500000, "timeSec": 14.8, "warning": "FULL_TABLE_SCAN" }
  ],
  "optimizedPlan": [
    { "id": 0, "operation": "SELECT STATEMENT", "cost": 150, "cardinality": 10000, "bytes": 500000, "timeSec": 0.09 },
    { "id": 1, "parentId": 0, "operation": "INDEX", "options": "RANGE SCAN", "objectName": "IDX_NEW", "cost": 150, "cardinality": 10000, "bytes": 500000, "timeSec": 0.09 }
  ],
  "riskAssessment": {
    "level": "LOW",
    "score": 15,
    "impactSummary": "Summary of operational impact...",
    "lockingRisk": "Risk of locking tables...",
    "rollbackPlan": "DROP INDEX ...;"
  }
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      const recommendation: TuningRecommendation = {
        id: `tune-${Date.now().toString(36)}`,
        sqlId,
        timestamp: new Date().toISOString(),
        originalSql: sqlQuery,
        optimizedSql: parsed.optimizedSql || sqlQuery,
        tuningRationale: parsed.tuningRationale || 'Optimized query structure and access paths for Oracle Cost-Based Optimizer.',
        detectedIssues: parsed.detectedIssues || ['Full table scan detected', 'Suboptimal join order'],
        recommendedHints: parsed.recommendedHints || ['/*+ GATHER_PLAN_STATISTICS */'],
        recommendedDdl: parsed.recommendedDdl || [],
        statisticsCommands: parsed.statisticsCommands || [],
        planBaselineCommand: parsed.planBaselineCommand,
        sqlProfileScript: parsed.sqlProfileScript,
        metricsComparison: parsed.metricsComparison || {
          originalCost: 35000,
          optimizedCost: 220,
          costReductionPct: 99.3,
          originalBufferGets: 1800000,
          estimatedBufferGets: 7400,
          bufferGetsReductionPct: 99.5,
          originalElapsedSec: 12.5,
          estimatedElapsedSec: 0.15,
          elapsedReductionPct: 98.8,
        },
        originalPlan: parsed.originalPlan || [
          { id: 0, operation: 'SELECT STATEMENT', cost: 35000, cardinality: 5000, bytes: 250000, timeSec: 12.5 },
          { id: 1, parentId: 0, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'TARGET_TABLE', cost: 35000, cardinality: 5000, bytes: 250000, timeSec: 12.5, warning: 'FULL_TABLE_SCAN' },
        ],
        optimizedPlan: parsed.optimizedPlan || [
          { id: 0, operation: 'SELECT STATEMENT', cost: 220, cardinality: 5000, bytes: 250000, timeSec: 0.15 },
          { id: 1, parentId: 0, operation: 'INDEX', options: 'RANGE SCAN', objectName: 'IDX_OPTIMIZED', cost: 220, cardinality: 5000, bytes: 250000, timeSec: 0.15 },
        ],
        riskAssessment: parsed.riskAssessment || {
          level: 'LOW',
          score: 20,
          impactSummary: 'Low risk. Non-intrusive index creation with ONLINE clause.',
          lockingRisk: 'Zero exclusive DDL locking.',
          rollbackPlan: 'DROP INDEX schema.idx_name;',
        },
        approvalStatus: 'PENDING_APPROVAL',
      };

      tuningHistory[sqlId] = recommendation;
      return res.json({ recommendation });
    }
  } catch (geminiErr) {
    console.error('Error invoking Gemini for tuning:', geminiErr);
  }

  // Fallback intelligent domain tuning response
  const fallbackRec: TuningRecommendation = {
    id: `tune-${Date.now().toString(36)}`,
    sqlId,
    timestamp: new Date().toISOString(),
    originalSql: sqlQuery,
    optimizedSql: `SELECT /*+ LEADING(t) USE_HASH(t) GATHER_PLAN_STATISTICS */\n  *\nFROM (\n  ${sqlQuery.replace(/;\s*$/, '')}\n) t`,
    tuningRationale: `1. Query was analyzed using Oracle CBO heuristics.\n2. Identified sequential I/O bottleneck and potential unindexed predicate filtering.\n3. Introduced optimizer hint to force hash operations and index-guided filtering.\n4. Recommended composite index creation with ONLINE clause to eliminate single-block random reads.`,
    detectedIssues: [
      'Unindexed filter predicate causing potential TABLE ACCESS FULL',
      'High buffer gets / CPU consumption during result set sorting',
      'Missing optimizer statistics for optimal cardinality estimation',
    ],
    recommendedHints: ['/*+ LEADING(t) USE_HASH(t) */', '/*+ GATHER_PLAN_STATISTICS */'],
    recommendedDdl: [
      `-- Recommended Composite Index for predicate filtering\nCREATE INDEX ${parsingSchema}.IDX_OPT_${sqlId.slice(0, 8)} \nON ${parsingSchema}.APP_TABLE (STATUS, CREATED_DATE) \nTABLESPACE INDX_TBS01 \nONLINE COMPUTE STATISTICS;`,
    ],
    statisticsCommands: [
      `BEGIN\n  DBMS_STATS.GATHER_TABLE_STATS(\n    ownname => '${parsingSchema}',\n    tabname => 'APP_TABLE',\n    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,\n    cascade => TRUE\n  );\nEND;\n/`,
    ],
    planBaselineCommand: `DECLARE\n  l_plans PLS_INTEGER;\nBEGIN\n  l_plans := DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(sql_id => '${sqlId}');\nEND;\n/`,
    metricsComparison: {
      originalCost: 28400,
      optimizedCost: 195,
      costReductionPct: 99.3,
      originalBufferGets: 1450000,
      estimatedBufferGets: 8200,
      bufferGetsReductionPct: 99.4,
      originalElapsedSec: 9.8,
      estimatedElapsedSec: 0.12,
      elapsedReductionPct: 98.7,
    },
    originalPlan: [
      { id: 0, operation: 'SELECT STATEMENT', cost: 28400, cardinality: 8000, bytes: 400000, timeSec: 9.8 },
      { id: 1, parentId: 0, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'APP_TABLE', cost: 28400, cardinality: 8000, bytes: 400000, timeSec: 9.8, warning: 'FULL_TABLE_SCAN' },
    ],
    optimizedPlan: [
      { id: 0, operation: 'SELECT STATEMENT', cost: 195, cardinality: 8000, bytes: 400000, timeSec: 0.12 },
      { id: 1, parentId: 0, operation: 'INDEX', options: 'RANGE SCAN', objectName: `IDX_OPT_${sqlId.slice(0, 8)}`, cost: 195, cardinality: 8000, bytes: 400000, timeSec: 0.12 },
    ],
    riskAssessment: {
      level: 'LOW',
      score: 18,
      impactSummary: 'Low risk. Non-blocking DDL build using ONLINE clause.',
      lockingRisk: 'Zero exclusive locking on table.',
      rollbackPlan: `DROP INDEX ${parsingSchema}.IDX_OPT_${sqlId.slice(0, 8)};`,
    },
    approvalStatus: 'PENDING_APPROVAL',
  };

  tuningHistory[sqlId] = fallbackRec;
  return res.json({ recommendation: fallbackRec });
});

// 11. Human Approval & Execution of Tuning
app.post('/api/dba/apply-tuning', (req: Request, res: Response) => {
  const { recommendationId, sqlId, executedBy = 'DBA_USER' } = req.body;

  const rec = Object.values(tuningHistory).find((r) => r.id === recommendationId || r.sqlId === sqlId);
  if (!rec) {
    return res.status(404).json({ error: 'Recommendation not found' });
  }

  rec.approvalStatus = 'APPLIED';
  rec.appliedAt = new Date().toISOString();
  rec.approvedBy = executedBy;

  // Mark slow query status as TUNED / APPLIED
  slowQueries = slowQueries.map((sq) => {
    if (sq.sqlId === rec.sqlId) {
      return {
        ...sq,
        status: 'APPLIED',
        avgElapsedSec: Number(rec.metricsComparison.estimatedElapsedSec.toFixed(2)),
        bufferGets: rec.metricsComparison.estimatedBufferGets,
        currentCost: rec.metricsComparison.optimizedCost,
      };
    }
    return sq;
  });

  // Record into Audit Log
  const newAudit: TuningAuditEntry = {
    id: `audit-${Date.now()}`,
    sqlId: rec.sqlId,
    recommendationId: rec.id,
    executedBy,
    executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    actionType: rec.recommendedDdl.length > 0 ? 'CREATE_INDEX' : 'SQL_PLAN_BASELINE',
    executedCommands: [
      ...rec.recommendedDdl,
      ...(rec.planBaselineCommand ? [rec.planBaselineCommand] : []),
      ...rec.statisticsCommands,
    ],
    rollbackCommand: rec.riskAssessment.rollbackPlan,
    status: 'SUCCESS',
    executionTimeMs: Math.floor(Math.random() * 800) + 400,
    measuredImprovementPct: rec.metricsComparison.costReductionPct,
    notes: `Autonomous tuning successfully applied. Predicted elapsed time dropped from ${rec.metricsComparison.originalElapsedSec}s to ${rec.metricsComparison.estimatedElapsedSec}s (${rec.metricsComparison.elapsedReductionPct}% improvement).`,
  };

  auditLog.unshift(newAudit);

  // Relieve database load
  currentMetrics.cpuUtilization = Math.max(35, currentMetrics.cpuUtilization - 12);
  currentMetrics.bufferCacheHitRatio = Math.min(99.4, currentMetrics.bufferCacheHitRatio + 3.5);

  return res.json({
    success: true,
    message: `Tuning recommendation ${recommendationId} successfully applied to database!`,
    auditEntry: newAudit,
  });
});

// Helper: Generate LangChain / LlamaIndex execution trace
function generateAgentTrace(query: string, ragChunks: RagDocumentChunk[]): AgentExecutionTrace {
  const lower = query.toLowerCase();
  const traceId = `trace-${Date.now()}`;
  const steps: LangChainAgentStep[] = [];
  const startTs = new Date().toISOString();

  // Step 1: THOUGHT
  steps.push({
    stepNumber: 1,
    type: 'THOUGHT',
    title: 'Agent Telemetry & Intent Analysis',
    description: `Lead Model (${localLlmConfig.modelName}) analyzing DBA intent for: "${query.slice(0, 70)}...". Checking active instance metrics on PROD_RAC01 (CPU: ${currentMetrics.cpuUtilization}%, Buffer Hit: ${currentMetrics.bufferCacheHitRatio}%, Active Sessions: ${currentMetrics.activeSessions}).`,
    timestamp: startTs,
    durationMs: 42,
  });

  // Step 2: RAG_RETRIEVAL
  steps.push({
    stepNumber: 2,
    type: 'RAG_RETRIEVAL',
    title: 'Vector Semantic Search over Oracle 19c Knowledge Base',
    description: `Retrieved ${ragChunks.length} high-relevance chunks from Oracle 19c Performance Guide, CIS Benchmarks, and SOP Runbooks. Top match: "${ragChunks[0]?.docTitle || 'Oracle Guide'}" (Score: ${Math.round((ragChunks[0]?.relevanceScore || 0.95) * 100)}%).`,
    sourcesRetrieved: ragChunks,
    timestamp: new Date().toISOString(),
    durationMs: 85,
  });

  // Step 3: TOOL_INVOCATION
  if (lower.includes('kill') || lower.includes('142') || lower.includes('block') || lower.includes('lock')) {
    steps.push({
      stepNumber: 3,
      type: 'TOOL_INVOCATION',
      title: 'Tool Selected: kill_blocking_session',
      description: 'Preparing structured arguments to release exclusive TX row locks on ORDERS table.',
      toolName: 'kill_blocking_session',
      toolInput: { sid: 142, serial: 39812, username: 'FIN_APP_USER', immediate: true },
      toolOutput: { status: 'PREPARED_REQUIRING_HITL', riskLevel: 'HIGH' },
      timestamp: new Date().toISOString(),
      durationMs: 25,
    });
    steps.push({
      stepNumber: 4,
      type: 'HITL_VERIFICATION',
      title: 'Human-in-the-Loop Dual-Custody Check',
      description: 'Action classified as HIGH RISK. Routing to Dual-Custody Gate for Change Ticket (CAB) and Step-Up TOTP authentication.',
      timestamp: new Date().toISOString(),
      durationMs: 15,
    });
  } else if (lower.includes('remediate') || lower.includes('cis') || lower.includes('remote_os_authent')) {
    steps.push({
      stepNumber: 3,
      type: 'TOOL_INVOCATION',
      title: 'Tool Selected: remediate_security_rule',
      description: 'Generating SPFILE parameter change to disable unauthenticated remote OS authentication.',
      toolName: 'remediate_security_rule',
      toolInput: { ruleCode: 'CIS-ORA19-1.1', parameter: 'REMOTE_OS_AUTHENT', targetValue: 'FALSE', scope: 'SPFILE' },
      toolOutput: { status: 'PREPARED_REQUIRING_HITL', riskLevel: 'CRITICAL' },
      timestamp: new Date().toISOString(),
      durationMs: 30,
    });
    steps.push({
      stepNumber: 4,
      type: 'HITL_VERIFICATION',
      title: 'Human-in-the-Loop Dual-Custody Check',
      description: 'SPFILE modification classified as CRITICAL RISK. Routing to Dual-Custody Gate for operator clearance verification.',
      timestamp: new Date().toISOString(),
      durationMs: 12,
    });
  } else if (lower.includes('scan') || lower.includes('vapt') || lower.includes('oscap')) {
    steps.push({
      stepNumber: 3,
      type: 'TOOL_INVOCATION',
      title: 'Tool Selected: run_vapt_scan',
      description: 'Invoking automated OpenSCAP CIS 19c XCCDF benchmark evaluation.',
      toolName: 'run_vapt_scan',
      toolInput: { profile: 'xccdf_org.ssgproject.content_profile_cis_server_l1' },
      toolOutput: { status: 'EXECUTION_READY', riskLevel: 'LOW' },
      timestamp: new Date().toISOString(),
      durationMs: 65,
    });
  } else {
    steps.push({
      stepNumber: 3,
      type: 'TOOL_INVOCATION',
      title: 'Tool Selected: analyze_sql_cbo_metrics',
      description: 'Analyzing Cost-Based Optimizer execution plan metrics and buffer cache statistics.',
      toolName: 'analyze_sql_cbo_metrics',
      toolInput: { targetDb: 'PROD_RAC01', instance: 'PDB_FIN_CORE' },
      toolOutput: { status: 'SUCCESS', bufferCacheHit: currentMetrics.bufferCacheHitRatio },
      timestamp: new Date().toISOString(),
      durationMs: 40,
    });
  }

  // Step 5 & 6: OBSERVATION & FINAL_SYNTHESIS
  steps.push({
    stepNumber: steps.length + 1,
    type: 'OBSERVATION',
    title: 'Framework Observation & Grounding',
    description: `Synthesized findings with grounded RAG context from "${ragChunks[0]?.section || 'Runbook'}". Formulation verified against Oracle best practices.`,
    timestamp: new Date().toISOString(),
    durationMs: 38,
  });

  steps.push({
    stepNumber: steps.length + 1,
    type: 'FINAL_SYNTHESIS',
    title: 'Final Actionable Synthesis',
    description: `Lead Model (${localLlmConfig.modelName} via ${localLlmConfig.provider.toUpperCase()}) delivered actionable recommendation with production rollback safeguards.`,
    timestamp: new Date().toISOString(),
    durationMs: 22,
  });

  const totalDurationMs = steps.reduce((acc, s) => acc + (s.durationMs || 0), 0);

  return {
    id: traceId,
    query,
    leadModel: localLlmConfig.modelName,
    provider: localLlmConfig.provider,
    framework: 'LangChain Agent',
    steps,
    totalDurationMs,
    ragChunksUsed: ragChunks.length,
  };
}

// 12. Interactive DBA Co-Pilot Chat with RAG Grounding & Lead Model Orchestration
app.post('/api/dba/chat', async (req: Request, res: Response) => {
  const { message, history = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Retrieve relevant RAG knowledge chunks
  const ragChunks = searchRagKnowledge(message, 3);
  const agentTrace = generateAgentTrace(message, ragChunks);

  try {
    if (process.env.GEMINI_API_KEY && !localLlmConfig.isLead) {
      const ragContext = ragChunks
        .map((c, i) => `[Source ${i + 1}: ${c.docTitle} - ${c.section}]\n${c.content}`)
        .join('\n\n');

      const systemInstruction = `You are "Oracle DBA Sentinel", an autonomous AI Database Administrator Co-Pilot for Oracle 19c/21c/23c Enterprise databases.
You operate with access to an internal RAG knowledge base. Incorporate the following verified documentation when formulating your answer:

--- BEGIN RAG RETRIEVED KNOWLEDGE ---
${ragContext}
--- END RAG RETRIEVED KNOWLEDGE ---

Current Database State:
- Target DB: PROD_RAC01 (PDB_FIN_CORE, Oracle 19.18)
- CPU: ${currentMetrics.cpuUtilization}% | Buffer Cache Hit: ${currentMetrics.bufferCacheHitRatio}% | Active Sessions: ${currentMetrics.activeSessions}
- Top Wait Event: ${waitEvents[0].eventName} (${waitEvents[0].percentageDbTime}% DB Time)
- Active Slow Queries: ${slowQueries.length} pending

Be concise, authoritative, professional, and provide copyable SQL/PL/SQL code blocks with clear explanations.`;

      // Build conversation turns
      const contents = history.map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: localLlmConfig.temperature,
        },
      });

      return res.json({
        reply: response.text,
        ragChunks,
        agentTrace,
        leadModel: 'gemini-3.8-flash',
        provider: 'gemini_hybrid',
      });
    }
  } catch (err) {
    console.error('AI chat error:', err);
  }

  // Lead Model (Local LLM via Ollama / vLLM / LM Studio / LocalAI) Reasoning Engine
  const lower = message.toLowerCase();
  let leadPrefix = ``;
  if (localLlmConfig.isLead) {
    leadPrefix = `> **Lead Model Inference:** Powered by \`${localLlmConfig.modelName}\` (${localLlmConfig.provider.toUpperCase()} @ ${localLlmConfig.latencyMs}ms) via **LangChain RAG Agent**\n\n`;
  }

  let fallbackReply = `${leadPrefix}**Oracle DBA Sentinel Analysis:**\n\nI have evaluated your request against the active Oracle 19c instance (\`PROD_RAC01\`) using RAG-grounded knowledge from *${ragChunks[0]?.docTitle || 'Oracle Database 19c Architecture'}*.`;

  if (lower.includes('lock') || lower.includes('tx') || lower.includes('contention') || lower.includes('block')) {
    fallbackReply = `${leadPrefix}### Diagnosing \`enq: TX - row lock contention\`
*Grounded via RAG: ${ragChunks[0]?.docTitle} (${ragChunks[0]?.section})*

Active blocker detected in instance:
- **Blocker SID:** 142 (\`FIN_APP_USER\`)
- **Holding:** Exclusive Row Lock (Mode 6) on \`FIN_CORE.ORDERS\`
- **Waiting Sessions:** SID 198 and SID 205 (Waiting over 140 seconds)

#### Diagnostic Query to identify row and table:
\`\`\`sql
SELECT s.sid, s.serial#, s.username, s.blocking_session, 
       o.object_name, s.row_wait_obj#, s.row_wait_row#
FROM v$session s
LEFT JOIN dba_objects o ON s.row_wait_obj# = o.object_id
WHERE s.blocking_session IS NOT NULL;
\`\`\`

#### Human-in-the-Loop Safe Remediation:
Terminating production blockers requires dual-custody approval. Click the **Authorize Blocker Termination** tool call below to submit for Change Advisory Board (CAB) validation and step-up MFA.`;
  } else if (lower.includes('ora-01555') || lower.includes('snapshot too old')) {
    fallbackReply = `${leadPrefix}### Resolving \`ORA-01555: snapshot too old: rollback segment number with name "..." too small\`
*Grounded via RAG: ${ragChunks[0]?.docTitle} (${ragChunks[0]?.section})*

**Root Cause:** A long-running query requires read-consistent images of blocks from UNDO tablespace (\`UNDOTBS1\`), but concurrent transaction commits overwrote the required undo blocks.

#### Remediation Steps:
1. Check current UNDO retention and tablespace size:
\`\`\`sql
SHOW PARAMETER undo_retention;
SELECT tablespace_name, retention FROM dba_tablespaces WHERE contents = 'UNDO';
\`\`\`
2. Increase UNDO retention to cover longest batch job (e.g. 14400 seconds / 4 hours):
\`\`\`sql
ALTER SYSTEM SET UNDO_RETENTION = 14400 SCOPE=BOTH;
\`\`\`
3. Enable Guaranteed Undo Retention to prevent overwrites:
\`\`\`sql
ALTER TABLESPACE UNDOTBS1 RETENTION GUARANTEE;
\`\`\``;
  } else if (lower.includes('slow') || lower.includes('tune') || lower.includes('query') || lower.includes('plan')) {
    fallbackReply = `${leadPrefix}### Top Slow SQL Recommendation (SQL_ID: \`8f7q2m8x9p31a\`)
*Grounded via RAG: ${ragChunks[0]?.docTitle} (${ragChunks[0]?.section})*

Currently, SQL ID **\`8f7q2m8x9p31a\`** accounts for 44.8% of User I/O wait time (\`db file sequential read\`).

**Bottleneck:** \`UPPER(c.country)\` predicate suppresses the standard B-Tree index on \`CUSTOMERS\`, triggering a 12M-row Full Table Scan (TABLE ACCESS FULL).

**Recommended Fix (CBO Advisor):**
\`\`\`sql
-- Create Function-Based Index online without blocking concurrent DML:
CREATE INDEX FIN_CORE.IDX_CUST_COUNTRY_UPPER 
ON FIN_CORE.CUSTOMERS (UPPER(country)) 
TABLESPACE INDX_TBS01 ONLINE COMPUTE STATISTICS;
\`\`\`
Predicted cost reduction: **84.6%** (from 28,400 to 195). Navigate to the **SQL Tuner Studio** or approve the tool call below to generate the dual-custody ticket!`;
  } else if (lower.includes('cis') || lower.includes('security') || lower.includes('vapt') || lower.includes('oscap') || lower.includes('remote_os_authent')) {
    fallbackReply = `${leadPrefix}### CIS Oracle 19c Benchmark Compliance Audit
*Grounded via RAG: ${ragChunks[0]?.docTitle} (${ragChunks[0]?.section})*

OpenSCAP automated scan summary for \`PROD_RAC01\`:
- **Current Compliance Score:** ${vaptSummary.complianceScorePct}%
- **Critical Risk:** \`REMOTE_OS_AUTHENT=TRUE\` allows spoofed OS credentials to authenticate without password verification.
- **Recommended Action:** Execute SPFILE hardening:
\`\`\`sql
ALTER SYSTEM SET REMOTE_OS_AUTHENT=FALSE SCOPE=SPFILE;
\`\`\`
This action requires Human-in-the-Loop clearance. Trigger the tool call below to launch the Dual-Custody Approval Gate.`;
  } else {
    fallbackReply = `${leadPrefix}### Oracle DBA Sentinel Status Overview
*Grounded via RAG: ${ragChunks[0]?.docTitle} (${ragChunks[0]?.section})*

- **Target DB:** \`PROD_RAC01 (PDB_FIN_CORE)\` (Oracle 19.18 Enterprise)
- **CPU Utilization:** ${currentMetrics.cpuUtilization}%
- **Buffer Cache Hit Ratio:** ${currentMetrics.bufferCacheHitRatio}%
- **Top Wait Event:** \`${waitEvents[0].eventName}\` (${waitEvents[0].percentageDbTime}% DB Time)
- **Lead Inference Engine:** \`${localLlmConfig.modelName}\` (${localLlmConfig.provider.toUpperCase()})

You can ask me to analyze specific SQL IDs, explain execution plans, diagnose ORA errors, execute OpenSCAP VAPT hardening, or view the LangChain reasoning trace.`;
  }

  return res.json({
    reply: fallbackReply,
    ragChunks,
    agentTrace,
    leadModel: localLlmConfig.modelName,
    provider: localLlmConfig.provider,
  });
});

// 12a. Local LLM Lead Model Configuration Endpoints
app.get('/api/dba/local-llm/config', (_req: Request, res: Response) => {
  res.json({ config: localLlmConfig });
});

app.post('/api/dba/local-llm/config', (req: Request, res: Response) => {
  const newConfig = req.body;
  localLlmConfig = {
    ...localLlmConfig,
    ...newConfig,
    lastChecked: new Date().toISOString(),
  };
  res.json({ success: true, config: localLlmConfig });
});

// 12b. RAG Knowledge Base Retrieval Endpoints
app.get('/api/dba/rag/documents', (_req: Request, res: Response) => {
  res.json({ chunks: INITIAL_RAG_KNOWLEDGE_BASE });
});

app.get('/api/dba/rag/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const topK = parseInt(req.query.topK as string) || 3;
  const chunks = searchRagKnowledge(query, topK);
  res.json({ chunks });
});

// 12c. LangChain / LlamaIndex Agent Execution Trace Endpoint
app.post('/api/dba/agent/trace', (req: Request, res: Response) => {
  const { query } = req.body;
  const ragChunks = searchRagKnowledge(query || '', 3);
  const trace = generateAgentTrace(query || 'Analyze active Oracle instance telemetry', ragChunks);
  res.json({ trace });
});

// Helper to recalculate VAPT / OSCAP summary
function updateVaptSummary() {
  const total = oscapRules.length;
  const passed = oscapRules.filter((r) => r.status === 'PASS').length;
  const remediated = oscapRules.filter((r) => r.status === 'REMEDIATED').length;
  const failed = oscapRules.filter((r) => r.status === 'FAIL').length;
  const score = total > 0 ? Number((((passed + remediated) / total) * 100).toFixed(1)) : 100;

  vaptSummary = {
    ...vaptSummary,
    totalChecks: total,
    passed,
    failed,
    remediated,
    complianceScorePct: score,
    status: score >= 90 ? 'COMPLIANT' : score >= 70 ? 'NEEDS_ATTENTION' : 'CRITICAL_RISK',
    scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  return vaptSummary;
}

// 12. GET VAPT & OSCAP Compliance Rules & Status
app.get('/api/dba/vapt-oscap', (_req: Request, res: Response) => {
  updateVaptSummary();
  res.json({ rules: oscapRules, summary: vaptSummary });
});

// 13. POST Trigger Automated VAPT & OSCAP Benchmark Scan
app.post('/api/dba/vapt-oscap/scan', async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  // Update scan timestamps on all rules
  oscapRules = oscapRules.map((rule) => ({
    ...rule,
    lastScannedAt: timestamp,
  }));

  updateVaptSummary();

  const scanLogs = [
    `[INFO] Initializing OpenSCAP engine version 1.3.8...`,
    `[INFO] Loading SCAP Benchmark: CIS Oracle Database 19c Benchmark v1.1.0 (XCCDF 1.2)`,
    `[INFO] Loading Target Profile: xccdf_org.ssgproject.content_profile_cis_server_l1`,
    `[INFO] Connecting to target instance: PROD_RAC01 (PDB_FIN_CORE)... Connected as SYSOPER.`,
    `[PASS] CIS-ORA19-4.1: Unified Auditing Enabled for Administrative & DDL Actions`,
    `[PASS] CIS-ORA19-6.3: SEC_PROTOCOL_ERROR_FURTHER_ACTION = DROP,3`,
    `[PASS] CIS-ORA19-7.2: SQLNET.EXPIRE_TIME = 10 (Dead Connection Detection)`,
    `[PASS] CIS-ORA19-8.1: RESOURCE_LIMIT = TRUE`,
    `[FAIL] CIS-ORA19-1.1: REMOTE_OS_AUTHENT is TRUE [CRITICAL RISK]`,
    `[FAIL] CIS-ORA19-2.1: Default accounts SCOTT, HR, OE are OPEN with default credentials [CRITICAL RISK]`,
    `[FAIL] CIS-ORA19-2.3: DEFAULT profile permits UNLIMITED failed login attempts [HIGH RISK]`,
    `[FAIL] CIS-ORA19-3.2: PUBLIC EXECUTE granted on UTL_FILE, UTL_HTTP, DBMS_JAVA [HIGH RISK]`,
    `[FAIL] CIS-ORA19-5.1: Tablespaces FIN_TBS01 and INDX_TBS01 are plaintext unencrypted [HIGH RISK]`,
    `[FAIL] DISA-STIG-V214432: AUDIT_SYS_OPERATIONS is not enforced to OS audit trail [HIGH RISK]`,
    `[COMPLETED] Automated VAPT & OSCAP Evaluation finished in 480ms. Score: ${vaptSummary.complianceScorePct}% (${vaptSummary.passed + vaptSummary.remediated}/${vaptSummary.totalChecks} passing).`,
  ];

  res.json({
    success: true,
    rules: oscapRules,
    summary: vaptSummary,
    scanLogs,
  });
});

// 14. POST Automated Remediation (Single rule or batch all failed)
app.post('/api/dba/vapt-oscap/remediate', (req: Request, res: Response) => {
  const { ruleId, batchAllFailed, executedBy = 'CHOPADE_V (Principal DBA)' } = req.body;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let remediatedRules: OscapRule[] = [];

  if (batchAllFailed) {
    oscapRules = oscapRules.map((rule, idx) => {
      if (rule.status === 'FAIL') {
        const remediatedRule: OscapRule = {
          ...rule,
          status: 'REMEDIATED',
          remediatedAt: timestamp,
          remediatedBy: executedBy,
        };
        remediatedRules.push(remediatedRule);

        // Prepend to audit log
        auditLog.unshift({
          id: `audit-sec-${Date.now()}-${idx}`,
          sqlId: rule.ruleCode,
          recommendationId: `OSCAP-${rule.ruleCode}`,
          executedBy,
          executedAt: timestamp,
          actionType: 'OSCAP_REMEDIATION',
          executedCommands: rule.remediationScript.split('\n').filter(Boolean),
          rollbackCommand: rule.rollbackScript,
          status: 'SUCCESS',
          executionTimeMs: 340,
          measuredImprovementPct: rule.severity === 'CRITICAL' ? 100 : rule.severity === 'HIGH' ? 88 : 65,
          notes: `Automated OSCAP Remediation: ${rule.title} (${rule.benchmark})`,
        });

        return remediatedRule;
      }
      return rule;
    });
  } else if (ruleId) {
    oscapRules = oscapRules.map((rule) => {
      if (rule.id === ruleId && rule.status === 'FAIL') {
        const remediatedRule: OscapRule = {
          ...rule,
          status: 'REMEDIATED',
          remediatedAt: timestamp,
          remediatedBy: executedBy,
        };
        remediatedRules.push(remediatedRule);

        auditLog.unshift({
          id: `audit-sec-${Date.now()}`,
          sqlId: rule.ruleCode,
          recommendationId: `OSCAP-${rule.ruleCode}`,
          executedBy,
          executedAt: timestamp,
          actionType: 'OSCAP_REMEDIATION',
          executedCommands: rule.remediationScript.split('\n').filter(Boolean),
          rollbackCommand: rule.rollbackScript,
          status: 'SUCCESS',
          executionTimeMs: 290,
          measuredImprovementPct: rule.severity === 'CRITICAL' ? 100 : rule.severity === 'HIGH' ? 88 : 65,
          notes: `Automated OSCAP Remediation: ${rule.title} (${rule.benchmark})`,
        });

        return remediatedRule;
      }
      return rule;
    });
  }

  updateVaptSummary();

  res.json({
    success: true,
    remediatedCount: remediatedRules.length,
    rules: oscapRules,
    summary: vaptSummary,
    auditLog,
  });
});

// 15. POST Terminal Command Execution (SQL*Plus, OSCAP, VAPT, Administrative)
app.post('/api/dba/terminal/execute', (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command string is required' });
  }

  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();
  const startMs = Date.now();

  let output = '';
  let status: 'SUCCESS' | 'ERROR' | 'WARNING' = 'SUCCESS';
  let prompt = 'SQL> ';
  let auditEntryId: string | undefined = undefined;

  // Help command
  if (lower === 'help' || lower === '?') {
    output = `
Oracle AI DBA Sentinel Unified Terminal
Supported Command Dialects:
--------------------------------------------------------------------------------
1. Oracle SQL & Administration:
   - SELECT * FROM v$session;
   - SELECT * FROM dba_tablespaces;
   - SELECT * FROM v$parameter WHERE name LIKE '%audit%';
   - SHOW PARAMETER <name>
   - ALTER SYSTEM SET <parameter> = <value> SCOPE=BOTH;
   - ALTER USER <username> ACCOUNT LOCK PASSWORD EXPIRE;
   - REVOKE EXECUTE ON <package> FROM PUBLIC;

2. OpenSCAP (OSCAP) CLI:
   - oscap xccdf eval --profile cis_server_l1
   - oscap xccdf generate fix --rule <rule_code>
   - oscap oval eval --benchmark cis_oracle_19c

3. Automated VAPT Suite:
   - vapt audit
   - vapt remediate <rule_code>
   - vapt remediate --all

4. Diagnostics & Utilities:
   - status              Display DB status & health summary
   - metrics             Display real-time CPU, SGA, IOPS
   - clear               Clear terminal buffer
   - help                Display this help reference
`;
  }
  // Clear command
  else if (lower === 'clear' || lower === 'cls') {
    output = '__CLEAR__';
  }
  // Status command
  else if (lower === 'status') {
    output = `
Instance Name:    PROD_RAC01 (PDB_FIN_CORE)
Version:          Oracle Database 19c Enterprise Edition Release 19.18.0.0.0
Status:           OPEN / READ WRITE
Instance Mode:    RAC Active-Active (Node 1)
Database Role:    PRIMARY
OpenSCAP Score:   ${vaptSummary.complianceScorePct}% (${vaptSummary.status})
CPU Utilization:  ${currentMetrics.cpuUtilization}%
Active Sessions:  ${currentMetrics.activeSessions}
Buffer Cache:     ${currentMetrics.bufferCacheHitRatio}% Hit Ratio
IOPS:             ${currentMetrics.iops}
`;
  }
  // Metrics command
  else if (lower === 'metrics') {
    output = `
Metric Name                    Current Value     Baseline Status
------------------------------ ----------------- ----------------
CPU Utilization                ${currentMetrics.cpuUtilization}%             ${currentMetrics.cpuUtilization > 85 ? 'HIGH WARNING' : 'NORMAL'}
SGA Allocated / Used           ${currentMetrics.sgaUtilization}%             OPTIMAL
Buffer Cache Hit Ratio         ${currentMetrics.bufferCacheHitRatio}%             TARGET >= 95%
Library Cache Hit Ratio        ${currentMetrics.libraryCacheHitRatio}%             OPTIMAL
Active Sessions                ${currentMetrics.activeSessions}                NORMAL
Total Sessions                 ${currentMetrics.totalSessions}               ALLOCATED
IOPS Rate                      ${currentMetrics.iops} req/s          STORAGE OK
Redo Generation Rate           ${currentMetrics.redoLogRateMBs} MB/s           NORMAL
`;
  }
  // OpenSCAP evaluation command
  else if (lower.startsWith('oscap xccdf eval') || lower.startsWith('oscap oval eval')) {
    prompt = 'sh-5.1$ ';
    const ruleResults = oscapRules.map((r) => {
      const code = r.ruleCode.padEnd(20);
      const res = r.status === 'PASS' || r.status === 'REMEDIATED' ? '[ PASS ]' : '[ FAIL ]';
      return `Rule ${code} ${res}  ${r.title}`;
    }).join('\n');

    output = `
Title:   OpenSCAP Oracle 19c Security Assessment
Profile: xccdf_org.ssgproject.content_profile_cis_server_l1
Target:  Oracle Database 19c Enterprise Edition (PROD_RAC01)
--------------------------------------------------------------------------------
${ruleResults}
--------------------------------------------------------------------------------
Evaluation Summary:
  Passed Checks:      ${vaptSummary.passed + vaptSummary.remediated}
  Failed Checks:      ${vaptSummary.failed}
  Compliance Score:   ${vaptSummary.complianceScorePct}%
  Benchmark Status:   ${vaptSummary.status}
  Report Artifact:    /var/log/oscap/cis_oracle19c_report_${Date.now()}.html
`;
  }
  // OpenSCAP generate fix
  else if (lower.startsWith('oscap xccdf generate fix')) {
    prompt = 'sh-5.1$ ';
    const failed = oscapRules.filter((r) => r.status === 'FAIL');
    if (failed.length === 0) {
      output = `No failed rules detected. System is 100% compliant with CIS Benchmark.`;
    } else {
      output = `
#!/bin/bash
# OpenSCAP Automated Remediation Script for CIS Oracle 19c Benchmark
# Generated on ${new Date().toISOString()}

sqlplus -s / as sysdba << 'EOF'
${failed.map((r) => `-- [Fix ${r.ruleCode}]: ${r.title}\n${r.remediationScript}`).join('\n\n')}
EXIT;
EOF
echo "[SUCCESS] Applied ${failed.length} compliance remediations."
`;
    }
  }
  // VAPT audit / scan
  else if (lower === 'vapt audit' || lower === 'vapt scan' || lower.startsWith('vapt audit')) {
    prompt = 'vapt-cli> ';
    updateVaptSummary();
    output = `
[+] Starting Automated Vulnerability Assessment & Penetration Test (VAPT)...
[+] Target Host: rac-node01.corp.internal:1521 / fin_core
[+] Target Version: Oracle Database 19c EE Release 19.18

[*] Testing Category: AUTHENTICATION
    [-] REMOTE_OS_AUTHENT: ${oscapRules.find((r) => r.ruleCode === 'CIS-ORA19-1.1')?.status}
    [-] Default Sample Accounts (SCOTT/HR/OE): ${oscapRules.find((r) => r.ruleCode === 'CIS-ORA19-2.1')?.status}
    [-] Password Profile Complexity: ${oscapRules.find((r) => r.ruleCode === 'CIS-ORA19-2.3')?.status}

[*] Testing Category: ACCESS CONTROL & PRIVILEGES
    [-] Public Package Grants (UTL_FILE/UTL_HTTP/DBMS_JAVA): ${oscapRules.find((r) => r.ruleCode === 'CIS-ORA19-3.2')?.status}
    [-] Resource Exhaustion Controls: PASS

[*] Testing Category: ENCRYPTION & DATA AT REST
    [-] Tablespace TDE Encryption: ${oscapRules.find((r) => r.ruleCode === 'CIS-ORA19-5.1')?.status}

[*] Testing Category: AUDITING & INTEGRITY
    [-] Unified Audit Policies: PASS
    [-] SYSDBA OS Audit Trail: ${oscapRules.find((r) => r.ruleCode === 'DISA-STIG-V214432')?.status}

[!] VAPT Assessment Complete: ${vaptSummary.failed} vulnerabilities identified. Compliance Score: ${vaptSummary.complianceScorePct}%
[!] Use 'vapt remediate --all' to apply automated CIS remediations.
`;
  }
  // VAPT remediate command
  else if (lower === 'vapt remediate --all' || lower.startsWith('vapt remediate')) {
    prompt = 'vapt-cli> ';
    const failedCount = oscapRules.filter((r) => r.status === 'FAIL').length;
    if (failedCount === 0) {
      output = `All security rules already compliant! Compliance Score: 100%.`;
    } else {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      oscapRules = oscapRules.map((rule, idx) => {
        if (rule.status === 'FAIL') {
          auditLog.unshift({
            id: `audit-term-${Date.now()}-${idx}`,
            sqlId: rule.ruleCode,
            recommendationId: `OSCAP-${rule.ruleCode}`,
            executedBy: 'DBA_TERMINAL (Interactive)',
            executedAt: timestamp,
            actionType: 'OSCAP_REMEDIATION',
            executedCommands: rule.remediationScript.split('\n').filter(Boolean),
            rollbackCommand: rule.rollbackScript,
            status: 'SUCCESS',
            executionTimeMs: 250,
            measuredImprovementPct: 100,
            notes: `Automated Terminal Remediation: ${rule.title}`,
          });
          return {
            ...rule,
            status: 'REMEDIATED',
            remediatedAt: timestamp,
            remediatedBy: 'DBA_TERMINAL',
          };
        }
        return rule;
      });
      updateVaptSummary();
      output = `
[+] Executing automated remediations across ${failedCount} security findings...
[+] Remediated CIS-ORA19-1.1: REMOTE_OS_AUTHENT set to FALSE.
[+] Remediated CIS-ORA19-2.1: Locked & expired SCOTT, HR, OE, SH default accounts.
[+] Remediated CIS-ORA19-2.3: Enforced FAILED_LOGIN_ATTEMPTS 5 on DEFAULT profile.
[+] Remediated CIS-ORA19-3.2: Revoked PUBLIC execute on UTL_FILE, UTL_HTTP, UTL_TCP, DBMS_JAVA.
[+] Remediated CIS-ORA19-5.1: Enabled TDE tablespace encryption on FIN_TBS01.
[+] Remediated DISA-STIG-V214432: Enabled AUDIT_SYS_OPERATIONS in SPFILE.
--------------------------------------------------------------------------------
[SUCCESS] ${failedCount} rules remediated. Compliance Score increased to ${vaptSummary.complianceScorePct}%.
[AUDIT] Action logged to dba_audit_trail with verification checksums.
`;
    }
  }
  // SHOW PARAMETER
  else if (lower.startsWith('show parameter')) {
    const param = lower.replace('show parameter', '').trim();
    const rows = [
      { name: 'remote_os_authent', type: 'boolean', value: oscapRules.find(r => r.ruleCode === 'CIS-ORA19-1.1')?.status === 'REMEDIATED' ? 'FALSE' : 'TRUE' },
      { name: 'sec_protocol_error_further_action', type: 'string', value: 'DROP,3' },
      { name: 'sqlnet.expire_time', type: 'integer', value: '10' },
      { name: 'audit_sys_operations', type: 'boolean', value: oscapRules.find(r => r.ruleCode === 'DISA-STIG-V214432')?.status === 'REMEDIATED' ? 'TRUE' : 'FALSE' },
      { name: 'resource_limit', type: 'boolean', value: 'TRUE' },
      { name: 'cpu_count', type: 'integer', value: '32' },
      { name: 'sga_target', type: 'big integer', value: '64G' },
      { name: 'pga_aggregate_target', type: 'big integer', value: '16G' },
    ].filter((p) => !param || p.name.includes(param));

    if (rows.length === 0) {
      output = `No parameters found matching '${param}'.`;
    } else {
      output = `
NAME                                 TYPE        VALUE
------------------------------------ ----------- ------------------------------
${rows.map((r) => `${r.name.padEnd(36)} ${r.type.padEnd(11)} ${r.value}`).join('\n')}
`;
    }
  }
  // SELECT FROM v$session
  else if (lower.includes('v$session')) {
    const header = '   SID   SERIAL# USERNAME             STATUS   EVENT                          MACHINE';
    const divider = '------ --------- -------------------- -------- ------------------------------ -------------------------';
    const rows = activeSessions.slice(0, 10).map((s) => {
      const sid = String(s.sid).padStart(6);
      const serial = String(s.serial).padStart(9);
      const user = (s.username || 'SYS').padEnd(20).substring(0, 20);
      const st = s.status.padEnd(8);
      const evt = s.event.padEnd(30).substring(0, 30);
      const mch = s.machine.padEnd(25).substring(0, 25);
      return `${sid} ${serial} ${user} ${st} ${evt} ${mch}`;
    });
    output = `
${header}
${divider}
${rows.join('\n')}

${activeSessions.length} rows selected.
`;
  }
  // SELECT FROM dba_tablespaces
  else if (lower.includes('dba_tablespaces')) {
    const header = 'TABLESPACE_NAME      BLOCK_SIZE STATUS    CONTENTS  ENCRYPTED';
    const divider = '-------------------- ---------- --------- --------- ---------';
    const rows = tablespaces.map((t) => {
      const name = t.name.padEnd(20);
      const bs = '      8192';
      const st = t.status.padEnd(9);
      const cnt = t.type.padEnd(9);
      const enc = (t.name === 'FIN_TBS01' && oscapRules.find(r => r.ruleCode === 'CIS-ORA19-5.1')?.status === 'REMEDIATED') ? 'YES' : 'NO';
      return `${name} ${bs} ${st} ${cnt} ${enc.padEnd(9)}`;
    });
    output = `
${header}
${divider}
${rows.join('\n')}

${tablespaces.length} rows selected.
`;
  }
  // DDL / ALTER / REVOKE statements
  else if (lower.startsWith('alter ') || lower.startsWith('create ') || lower.startsWith('drop ') || lower.startsWith('revoke ') || lower.startsWith('grant ')) {
    // Check if command remediates any known rule
    if (lower.includes('remote_os_authent=false')) {
      const r = oscapRules.find((x) => x.ruleCode === 'CIS-ORA19-1.1');
      if (r) r.status = 'REMEDIATED';
    }
    if (lower.includes('scott account lock') || lower.includes('hr account lock')) {
      const r = oscapRules.find((x) => x.ruleCode === 'CIS-ORA19-2.1');
      if (r) r.status = 'REMEDIATED';
    }
    if (lower.includes('failed_login_attempts 5')) {
      const r = oscapRules.find((x) => x.ruleCode === 'CIS-ORA19-2.3');
      if (r) r.status = 'REMEDIATED';
    }
    if (lower.includes('revoke execute on') && lower.includes('from public')) {
      const r = oscapRules.find((x) => x.ruleCode === 'CIS-ORA19-3.2');
      if (r) r.status = 'REMEDIATED';
    }
    if (lower.includes('tablespace fin_tbs01 encryption online')) {
      const r = oscapRules.find((x) => x.ruleCode === 'CIS-ORA19-5.1');
      if (r) r.status = 'REMEDIATED';
    }
    updateVaptSummary();

    const entryId = `audit-cmd-${Date.now()}`;
    auditEntryId = entryId;
    auditLog.unshift({
      id: entryId,
      sqlId: 'CLI_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      recommendationId: 'CLI_MANUAL_EXEC',
      executedBy: 'DBA_OPERATOR (Interactive Terminal)',
      executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actionType: lower.startsWith('create index') ? 'CREATE_INDEX' : 'SECURITY_HARDENING',
      executedCommands: [trimmed],
      rollbackCommand: '-- Manual rollback command required for custom DDL',
      status: 'SUCCESS',
      executionTimeMs: Date.now() - startMs + 45,
      measuredImprovementPct: 100,
      notes: `Executed via interactive DBA Sentinel terminal: ${trimmed.substring(0, 60)}...`,
    });

    output = `
Statement processed.
System / Object successfully altered.
Audit log entry created: ${entryId}
`;
  }
  // Default SQL or query
  else {
    output = `
PL/SQL procedure successfully completed.
Commit complete.
`;
  }

  const executionTimeMs = Date.now() - startMs;
  const result: TerminalExecutionResult = {
    command: trimmed,
    output: output.trim(),
    status,
    executionTimeMs,
    prompt,
    auditEntryId,
  };

  res.json({ result, summary: vaptSummary });
});


// Setup Vite Dev Server or Production Static Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Oracle AI DBA Sentinel Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
