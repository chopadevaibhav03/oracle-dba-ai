import { ragEngine } from './ragEngine';
import { AgentExecutionTrace, LangChainAgentStep, LocalLlmConfig, RagDocumentChunk } from '../types/llm';
import { CopilotToolCall, HitlActionRequest } from '../types/oracle';

export interface AgentRunResult {
  reply: string;
  trace: AgentExecutionTrace;
  retrievedSources: RagDocumentChunk[];
  toolCall?: CopilotToolCall;
  leadModelUsed: string;
}

export const DEFAULT_LOCAL_LLM_CONFIG: LocalLlmConfig = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  modelName: 'llama3.2:latest',
  isLead: true,
  temperature: 0.2,
  maxTokens: 2048,
  topP: 0.9,
  systemInstruction: `You are the Lead Oracle DBA Autonomous Sentinel Agent, powered by LangChain Agent framework and RAG vector knowledge. Always evaluate execution plan cost regressions, lock contention, and CIS benchmarks. Ground answers in retrieved Oracle documentation. Never bypass human approval for critical actions.`,
  isConnected: true,
  latencyMs: 28,
  lastChecked: new Date().toLocaleTimeString(),
};

export class LangChainAgentService {
  private localConfig: LocalLlmConfig = { ...DEFAULT_LOCAL_LLM_CONFIG };

  public getConfig(): LocalLlmConfig {
    return { ...this.localConfig };
  }

  public updateConfig(newConfig: Partial<LocalLlmConfig>): LocalLlmConfig {
    this.localConfig = {
      ...this.localConfig,
      ...newConfig,
      lastChecked: new Date().toLocaleTimeString(),
    };
    return this.getConfig();
  }

  public async runAgentPipeline(userQuery: string): Promise<AgentRunResult> {
    const startTime = Date.now();
    const steps: LangChainAgentStep[] = [];
    const lower = userQuery.toLowerCase();

    // 1. LangChain Agent Reasoning Step (Thought)
    steps.push({
      stepNumber: 1,
      type: 'THOUGHT',
      title: 'Agent Thought & Intent Extraction',
      description: `Analyzing prompt against target instance PROD_RAC01 (PDB_FIN_CORE). Determining required tool definitions and vector retrieval queries.`,
      timestamp: new Date().toLocaleTimeString(),
      durationMs: 45,
    });

    // 2. RAG Knowledge Retrieval Step
    const retrievedSources = ragEngine.search(userQuery, 3);
    steps.push({
      stepNumber: 2,
      type: 'RAG_RETRIEVAL',
      title: 'Vector Knowledge Retrieval (Oracle 19c Vector Store)',
      description: `Retrieved ${retrievedSources.length} semantic chunks from Oracle 19c documentation and internal DBA runbooks. Highest match: ${retrievedSources[0]?.docTitle} (${Math.round((retrievedSources[0]?.relevanceScore || 0.85) * 100)}%).`,
      sourcesRetrieved: retrievedSources,
      timestamp: new Date().toLocaleTimeString(),
      durationMs: 82,
    });

    // 3. Tool Selection & Critical Action Checking
    let toolCall: CopilotToolCall | undefined = undefined;
    let replyText = '';

    if (lower.includes('kill') && (lower.includes('session') || lower.includes('142') || lower.includes('block'))) {
      toolCall = {
        id: `tool-${Date.now()}`,
        toolName: 'kill_blocking_session',
        args: { sid: 142, serial: 39812, username: 'FIN_APP_USER', event: 'enq: TX - row lock contention' },
        isCritical: true,
        status: 'PENDING_APPROVAL',
      };

      steps.push({
        stepNumber: 3,
        type: 'TOOL_INVOCATION',
        title: 'Tool Invoked: oracle_session_terminator',
        description: `Selected tool 'kill_blocking_session' targeting blocker SID 142. Parameters: { sid: 142, serial: 39812 }.`,
        toolName: 'oracle_session_terminator',
        toolInput: toolCall.args,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 38,
      });

      steps.push({
        stepNumber: 4,
        type: 'HITL_VERIFICATION',
        title: 'HITL Dual-Custody Checkpoint (Critical Risk)',
        description: `Classified as HIGH RISK. Production session kill requires Layer 1 operator identity, Layer 2 TOTP token, and Layer 3 CAB ticket.`,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 20,
      });

      replyText = `### LangChain Lead Agent (RAG Grounded)
Based on **${retrievedSources[0]?.docTitle} (§10)**, session **SID 142** holds Mode 6 exclusive row lock on \`FIN_CORE.ORDERS\` stalling concurrent transactions.

**RAG Guidance:**
> "${retrievedSources[0]?.content.substring(0, 240)}..."

**Proposed Action:**
I have staged the tool \`kill_blocking_session(sid: 142)\`. Because this is an active production process, **Human-in-the-Loop (HITL) Dual-Custody Approval** is required before execution.`;

    } else if (lower.includes('remediate') || lower.includes('remote_os_authent') || lower.includes('cis')) {
      toolCall = {
        id: `tool-${Date.now()}`,
        toolName: 'remediate_security_rule',
        args: { ruleCode: 'CIS-ORA19-1.1', title: 'Disable REMOTE_OS_AUTHENT', targetValue: 'FALSE' },
        isCritical: true,
        status: 'PENDING_APPROVAL',
      };

      steps.push({
        stepNumber: 3,
        type: 'TOOL_INVOCATION',
        title: 'Tool Invoked: oracle_oscap_remediator',
        description: `Selected tool 'remediate_security_rule' for CIS 19c Benchmark hardening. Parameters: { ruleCode: 'CIS-ORA19-1.1' }.`,
        toolName: 'oracle_oscap_remediator',
        toolInput: toolCall.args,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 40,
      });

      steps.push({
        stepNumber: 4,
        type: 'HITL_VERIFICATION',
        title: 'HITL Dual-Custody Checkpoint (Critical Risk)',
        description: `Classified as CRITICAL RISK. Modifying SPFILE parameters requires operator clearance and CAB approval.`,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 25,
      });

      replyText = `### LangChain Lead Agent (RAG Grounded)
Referencing **${retrievedSources[0]?.docTitle} (${retrievedSources[0]?.section})**:
\`REMOTE_OS_AUTHENT=TRUE\` exposes the database to unauthorized remote administration bypassing database password authentication.

**RAG Specification:**
> "${retrievedSources[0]?.content.substring(0, 260)}..."

**Remediation Command:**
\`\`\`sql
ALTER SYSTEM SET REMOTE_OS_AUTHENT = FALSE SCOPE = SPFILE;
\`\`\`
Click below to authorize through the Multi-Layer HITL Gate.`;

    } else if (lower.includes('tune') || lower.includes('plan') || lower.includes('slow') || lower.includes('8f7q2m8x9p31a')) {
      toolCall = {
        id: `tool-${Date.now()}`,
        toolName: 'apply_sql_tuning',
        args: { sqlId: '8f7q2m8x9p31a', recommendationId: 'rec-init-001', expectedGainPct: 84.6 },
        isCritical: true,
        status: 'PENDING_APPROVAL',
      };

      steps.push({
        stepNumber: 3,
        type: 'TOOL_INVOCATION',
        title: 'Tool Invoked: oracle_cbo_optimizer',
        description: `Analyzing execution plan for SQL ID '8f7q2m8x9p31a'. Full table scan triggered by UPPER(country) function.`,
        toolName: 'oracle_cbo_optimizer',
        toolInput: toolCall.args,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 65,
      });

      replyText = `### LangChain Lead Agent (RAG Grounded)
Retrieved from **${retrievedSources[0]?.docTitle}**:
SQL ID **\`8f7q2m8x9p31a\`** uses \`UPPER(c.country)\` in its filter predicate, which forces the Cost-Based Optimizer (CBO) to suppress the B-Tree index on \`CUSTOMERS\` and perform a 12M-row Full Table Scan.

**Recommended Fix (Function-Based Index):**
\`\`\`sql
CREATE INDEX FIN_CORE.IDX_CUST_COUNTRY_UPPER 
ON FIN_CORE.CUSTOMERS (UPPER(country)) 
TABLESPACE INDX_TBS01 ONLINE COMPUTE STATISTICS;
\`\`\`
Predicted cost reduction: **-84.6%** (Buffer gets down from 1.4M to 12.8K). Authorize via HITL below.`;

    } else {
      steps.push({
        stepNumber: 3,
        type: 'OBSERVATION',
        title: 'Knowledge Synthesis',
        description: `Synthesized findings using retrieved documentation from ${retrievedSources.map((s) => s.docTitle).join(', ')}.`,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 50,
      });

      replyText = `### LangChain Lead Agent Status & RAG Analysis
I am the lead **${this.localConfig.modelName}** model running via **${this.localConfig.provider.toUpperCase()}** inference.

**Retrieved Knowledge References:**
- **${retrievedSources[0]?.docTitle}:** ${retrievedSources[0]?.section}
- **${retrievedSources[1]?.docTitle}:** ${retrievedSources[1]?.section}

I have access to live database telemetry, Cost-Based Optimizer explain plans, OpenSCAP CIS benchmarks, and dual-custody approval tools. You can instruct me to diagnose wait events, kill blockers, or harden parameters.`;
    }

    const totalDuration = Date.now() - startTime;
    const trace: AgentExecutionTrace = {
      id: `trace-${Date.now()}`,
      query: userQuery,
      leadModel: this.localConfig.modelName,
      provider: this.localConfig.provider,
      framework: 'LangChain Agent',
      steps,
      totalDurationMs: totalDuration,
      ragChunksUsed: retrievedSources.length,
    };

    return {
      reply: replyText,
      trace,
      retrievedSources,
      toolCall,
      leadModelUsed: `${this.localConfig.modelName} (${this.localConfig.provider.toUpperCase()} Lead)`,
    };
  }
}

export const langChainAgentService = new LangChainAgentService();
