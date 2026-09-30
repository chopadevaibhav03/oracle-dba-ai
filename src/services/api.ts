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
} from '../types/oracle';
import {
  AgentExecutionTrace,
  LocalLlmConfig,
  RagDocumentChunk,
} from '../types/llm';

export const api = {
  async getMetrics(): Promise<{ metrics: OracleMetric; status: 'HEALTHY' | 'WARNING' | 'CRITICAL' }> {
    const res = await fetch('/api/dba/metrics');
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getWaitEvents(): Promise<{ waitEvents: WaitEvent[] }> {
    const res = await fetch('/api/dba/wait-events');
    if (!res.ok) throw new Error('Failed to fetch wait events');
    return res.json();
  },

  async getTablespaces(): Promise<{ tablespaces: TablespaceInfo[] }> {
    const res = await fetch('/api/dba/tablespaces');
    if (!res.ok) throw new Error('Failed to fetch tablespaces');
    return res.json();
  },

  async getSessions(): Promise<{ sessions: OracleSession[] }> {
    const res = await fetch('/api/dba/sessions');
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async getSlowQueries(): Promise<{ slowQueries: SlowQuery[] }> {
    const res = await fetch('/api/dba/slow-queries');
    if (!res.ok) throw new Error('Failed to fetch slow queries');
    return res.json();
  },

  async getAuditLog(): Promise<{ auditLog: TuningAuditEntry[] }> {
    const res = await fetch('/api/dba/audit-log');
    if (!res.ok) throw new Error('Failed to fetch audit log');
    return res.json();
  },

  async getVaptOscap(): Promise<{ rules: OscapRule[]; summary: VaptScanSummary }> {
    const res = await fetch('/api/dba/vapt-oscap');
    if (!res.ok) throw new Error('Failed to fetch VAPT & OSCAP compliance data');
    return res.json();
  },

  async runVaptScan(): Promise<{
    success: boolean;
    rules: OscapRule[];
    summary: VaptScanSummary;
    scanLogs: string[];
  }> {
    const res = await fetch('/api/dba/vapt-oscap/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to execute automated VAPT scan');
    return res.json();
  },

  async remediateVaptRule(params: {
    ruleId?: string;
    batchAllFailed?: boolean;
    executedBy?: string;
  }): Promise<{
    success: boolean;
    remediatedCount: number;
    rules: OscapRule[];
    summary: VaptScanSummary;
    auditLog: TuningAuditEntry[];
  }> {
    const res = await fetch('/api/dba/vapt-oscap/remediate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to apply automated OSCAP remediation');
    return res.json();
  },

  async executeTerminalCommand(command: string): Promise<{
    result: TerminalExecutionResult;
    summary?: VaptScanSummary;
  }> {
    const res = await fetch('/api/dba/terminal/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute command in terminal');
    }
    return res.json();
  },

  async tuneSql(params: {
    sqlQuery: string;
    sqlId?: string;
    parsingSchema?: string;
    targetDb?: string;
  }): Promise<{ recommendation: TuningRecommendation }> {
    const res = await fetch('/api/dba/tune-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze and tune SQL');
    }
    return res.json();
  },

  async generateExplainPlan(sqlQuery: string): Promise<{ plan: ExplainPlanStep[] }> {
    const res = await fetch('/api/dba/explain-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sqlQuery }),
    });
    if (!res.ok) throw new Error('Failed to generate explain plan');
    return res.json();
  },

  async applyTuning(params: {
    recommendationId: string;
    sqlId: string;
    executedBy?: string;
  }): Promise<{ success: boolean; message: string; auditEntry: TuningAuditEntry }> {
    const res = await fetch('/api/dba/apply-tuning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to apply tuning recommendation');
    }
    return res.json();
  },

  async killSession(sid: number, serial: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/dba/kill-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid, serial }),
    });
    if (!res.ok) throw new Error('Failed to terminate session');
    return res.json();
  },

  async simulateWorkload(scenario: string): Promise<any> {
    const res = await fetch('/api/dba/simulate-workload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (!res.ok) throw new Error('Failed to trigger workload simulation');
    return res.json();
  },

  async chat(message: string, history: Array<{ role: string; content: string }>): Promise<{
    reply: string;
    ragChunks?: RagDocumentChunk[];
    agentTrace?: AgentExecutionTrace;
    leadModel?: string;
    provider?: string;
  }> {
    const res = await fetch('/api/dba/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Failed to communicate with DBA Co-Pilot');
    return res.json();
  },

  async getLocalLlmConfig(): Promise<{ config: LocalLlmConfig }> {
    const res = await fetch('/api/dba/local-llm/config');
    if (!res.ok) throw new Error('Failed to fetch Local LLM config');
    return res.json();
  },

  async updateLocalLlmConfig(newConfig: Partial<LocalLlmConfig>): Promise<{ success: boolean; config: LocalLlmConfig }> {
    const res = await fetch('/api/dba/local-llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) throw new Error('Failed to update Local LLM config');
    return res.json();
  },

  async searchRag(query: string, topK = 3): Promise<{ chunks: RagDocumentChunk[] }> {
    const res = await fetch(`/api/dba/rag/search?q=${encodeURIComponent(query)}&topK=${topK}`);
    if (!res.ok) throw new Error('Failed to search RAG knowledge base');
    return res.json();
  },

  async getAgentTrace(query: string): Promise<{ trace: AgentExecutionTrace }> {
    const res = await fetch('/api/dba/agent/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Failed to fetch Agent execution trace');
    return res.json();
  },
};

