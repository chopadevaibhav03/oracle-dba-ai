export interface OracleMetric {
  timestamp: string;
  cpuUtilization: number; // percentage
  sgaUtilization: number; // percentage
  pgaUtilization: number; // percentage
  bufferCacheHitRatio: number; // percentage (e.g. 98.4%)
  libraryCacheHitRatio: number; // percentage
  activeSessions: number;
  totalSessions: number;
  redoLogRateMBs: number; // MB/sec
  iops: number;
  dbTimeRate: number; // Active session history / DB time per sec
}

export interface WaitEvent {
  eventName: string;
  waitClass: 'User I/O' | 'System I/O' | 'Concurrency' | 'Application' | 'Commit' | 'Configuration' | 'Administrative' | 'Other';
  totalWaits: number;
  timeWaitedSec: number;
  percentageDbTime: number;
  avgWaitMs: number;
  severity: 'normal' | 'warning' | 'critical';
}

export interface OracleSession {
  sid: number;
  serial: number;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'KILLED';
  osUser: string;
  machine: string;
  program: string;
  sqlId?: string;
  event: string;
  waitClass: string;
  secondsInWait: number;
  blockingSid?: number;
  cpuTimeMs: number;
  logonTime: string;
}

export interface TablespaceInfo {
  name: string;
  type: 'PERMANENT' | 'TEMPORARY' | 'UNDO';
  totalSizeMB: number;
  usedSizeMB: number;
  freeSizeMB: number;
  pctUsed: number;
  status: 'ONLINE' | 'OFFLINE' | 'READ ONLY';
  autoextend: boolean;
  datafileCount: number;
}

export interface ExplainPlanStep {
  id: number;
  parentId?: number;
  operation: string;
  options?: string;
  objectName?: string;
  objectType?: string;
  cost: number;
  cardinality: number; // rows
  bytes: number;
  timeSec: number;
  accessPredicates?: string;
  filterPredicates?: string;
  warning?: 'FULL_TABLE_SCAN' | 'CARTESIAN_JOIN' | 'TEMP_SPILL' | 'CARDINALITY_MISMATCH' | 'HIGH_COST';
}

export interface SlowQuery {
  sqlId: string;
  planHashValue: number;
  sqlText: string;
  parsingSchema: string;
  module: string;
  executions: number;
  elapsedTimeSec: number;
  avgElapsedSec: number;
  cpuTimeSec: number;
  bufferGets: number;
  diskReads: number;
  rowsProcessed: number;
  firstLoadTime: string;
  lastActiveTime: string;
  status: 'PENDING_ANALYSIS' | 'TUNED' | 'APPLIED' | 'IGNORED';
  currentCost: number;
  bottlenecks?: string[];
}

export interface TuningRecommendation {
  id: string;
  sqlId: string;
  timestamp: string;
  originalSql: string;
  optimizedSql: string;
  tuningRationale: string;
  detectedIssues: string[];
  recommendedHints: string[];
  recommendedDdl: string[];
  statisticsCommands: string[];
  planBaselineCommand?: string;
  sqlProfileScript?: string;
  metricsComparison: {
    originalCost: number;
    optimizedCost: number;
    costReductionPct: number;
    originalBufferGets: number;
    estimatedBufferGets: number;
    bufferGetsReductionPct: number;
    originalElapsedSec: number;
    estimatedElapsedSec: number;
    elapsedReductionPct: number;
  };
  originalPlan: ExplainPlanStep[];
  optimizedPlan: ExplainPlanStep[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    score: number; // 1-100
    impactSummary: string;
    lockingRisk: string;
    rollbackPlan: string;
  };
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'APPLIED' | 'REJECTED';
  appliedAt?: string;
  approvedBy?: string;
}

export interface TuningAuditEntry {
  id: string;
  sqlId: string;
  recommendationId: string;
  executedBy: string;
  executedAt: string;
  actionType: 'CREATE_INDEX' | 'SQL_PROFILE' | 'SQL_PLAN_BASELINE' | 'GATHER_STATS' | 'QUERY_REWRITE' | 'SECURITY_HARDENING' | 'OSCAP_REMEDIATION';
  executedCommands: string[];
  rollbackCommand: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  executionTimeMs: number;
  measuredImprovementPct: number;
  notes: string;
}

export interface OscapRule {
  id: string;
  ruleCode: string;
  title: string;
  category: 'AUTHENTICATION' | 'ACCESS_CONTROL' | 'ENCRYPTION' | 'AUDITING' | 'NETWORK' | 'PATCHING';
  benchmark: 'CIS Oracle 19c Benchmark v1.1.0' | 'DISA STIG Oracle 19c' | 'PCI-DSS v4.0';
  profile: 'Level 1 - RDBMS' | 'Level 2 - High Security' | 'STIG MAC-I';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PASS' | 'FAIL' | 'REMEDIATED';
  description: string;
  rationale: string;
  auditQuery: string;
  remediationScript: string;
  rollbackScript: string;
  lastScannedAt: string;
  remediatedAt?: string;
  remediatedBy?: string;
}

export interface VaptScanSummary {
  scanId: string;
  scannedAt: string;
  database: string;
  totalChecks: number;
  passed: number;
  failed: number;
  remediated: number;
  complianceScorePct: number;
  status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK';
}

export interface TerminalExecutionResult {
  command: string;
  output: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  executionTimeMs: number;
  prompt: string;
  auditEntryId?: string;
}

export interface DatabaseTarget {
  id: string;
  name: string;
  type: 'CDB' | 'PDB' | 'RAC';
  host: string;
  port: number;
  serviceName: string;
  version: string;
  environment: 'PRODUCTION' | 'STAGING' | 'DATA_WAREHOUSE';
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface HitlActionRequest {
  id: string;
  title: string;
  actionType: 'KILL_SESSION' | 'APPLY_TUNING' | 'OSCAP_REMEDIATE' | 'BATCH_REMEDIATE' | 'TERMINAL_DDL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blastRadius: string;
  database: string;
  commands: string[];
  rollbackCommand?: string;
  initiator: string;
  payload: any;
}

export interface CopilotToolCall {
  id: string;
  toolName: 'kill_blocking_session' | 'apply_sql_tuning' | 'remediate_security_rule' | 'run_vapt_scan' | 'inspect_execution_plan' | 'inspect_session_locks';
  args: Record<string, any>;
  isCritical: boolean;
  status: 'PROPOSED' | 'PENDING_APPROVAL' | 'EXECUTED' | 'REJECTED';
  result?: any;
}

export interface CopilotCrewMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  specialty: string;
  status: 'ACTIVE' | 'IDLE' | 'ANALYZING';
}

