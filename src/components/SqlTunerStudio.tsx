import React, { useState } from 'react';
import { ExplainPlanStep, SlowQuery, TuningRecommendation } from '../types/oracle';
import { ExplainPlanViewer } from './ExplainPlanViewer';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  Flame,
  Gauge,
  Lightbulb,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface Props {
  slowQueries: SlowQuery[];
  selectedSlowQuery: SlowQuery | null;
  setSelectedSlowQuery: (q: SlowQuery | null) => void;
  tuningRecommendation: TuningRecommendation | null;
  isTuning: boolean;
  onTuneSql: (sql: string, sqlId?: string, parsingSchema?: string) => Promise<void>;
  onApplyTuning: (recId: string, sqlId: string) => Promise<void>;
  isApplying: boolean;
}

export const SqlTunerStudio: React.FC<Props> = ({
  slowQueries,
  selectedSlowQuery,
  setSelectedSlowQuery,
  tuningRecommendation,
  isTuning,
  onTuneSql,
  onApplyTuning,
  isApplying,
}) => {
  const [customSql, setCustomSql] = useState<string>(
    selectedSlowQuery?.sqlText ||
      `SELECT o.order_id, c.customer_name, c.email, o.order_date,
       SUM(oi.quantity * oi.unit_price) AS total_amount
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE UPPER(c.country) = 'UNITED STATES'
  AND o.order_date >= TO_DATE('2024-01-01', 'YYYY-MM-DD')
GROUP BY o.order_id, c.customer_name, c.email, o.order_date
HAVING SUM(oi.quantity * oi.unit_price) > 500
ORDER BY total_amount DESC`
  );

  const [schema, setSchema] = useState<string>(selectedSlowQuery?.parsingSchema || 'FIN_CORE');
  const [activePlanTab, setActivePlanTab] = useState<'both' | 'original' | 'optimized'>('both');
  const [activeCodeTab, setActiveCodeTab] = useState<'rewrite' | 'hints' | 'ddl' | 'stats' | 'spm' | 'risk'>('rewrite');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleSelectQuery = (q: SlowQuery) => {
    setSelectedSlowQuery(q);
    setCustomSql(q.sqlText);
    setSchema(q.parsingSchema);
  };

  const copyToClipboard = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const rec = tuningRecommendation;

  return (
    <div className="space-y-6">
      {/* Top Banner / Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Autonomous Oracle SQL Optimizer Studio
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                Gemini 3.8 Flash CBO Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Inspect live Oracle slow queries or paste any SQL to analyze CBO Cost, generate Explain Plans, produce rewritten SQL, online index DDL, optimizer hints, and SPM plan baselines.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              onClick={() => onTuneSql(customSql, selectedSlowQuery?.sqlId, schema)}
              disabled={isTuning || !customSql.trim()}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isTuning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Oracle Execution Plan...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Auto-Tune SQL with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Select Workload SQLs */}
        <div className="pt-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Select Active Workload Query to Optimize:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {slowQueries.map((q) => (
              <button
                key={q.sqlId}
                onClick={() => handleSelectQuery(q)}
                className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  selectedSlowQuery?.sqlId === q.sqlId
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 shadow-xs text-cyan-950 dark:text-cyan-200 ring-1 ring-cyan-500/50'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-extrabold text-xs text-cyan-700 dark:text-cyan-400">{q.sqlId}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                      q.status === 'APPLIED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
                <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200 mb-1">{q.module}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>
                    Avg: <strong className="text-amber-600 dark:text-amber-300 font-bold">{q.avgElapsedSec}s</strong>
                  </span>
                  <span>Cost: {q.currentCost.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Query Editor & Schema Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Oracle SQL Input &amp; Schema Context</span>
            {selectedSlowQuery && (
              <span className="text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded">
                SQL_ID: {selectedSlowQuery.sqlId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Parsing Schema:</label>
            <input
              type="text"
              value={schema}
              onChange={(e) => setSchema(e.target.value.toUpperCase())}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-lg w-32 text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="p-3">
          <textarea
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            rows={7}
            placeholder="SELECT * FROM table_name WHERE ..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y leading-relaxed"
          />
        </div>
      </div>

      {/* Tuning Results Section */}
      {rec && (
        <div className="space-y-6">
          {/* Metrics Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Optimizer Cost Reduction */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  CBO Cost
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  -{rec.metricsComparison.costReductionPct}%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {rec.metricsComparison.optimizedCost.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                  {rec.metricsComparison.originalCost.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Optimizer estimated resource units</p>
            </div>

            {/* Buffer Gets */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Buffer Gets (Logical I/O)
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  -{rec.metricsComparison.bufferGetsReductionPct}%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {rec.metricsComparison.estimatedBufferGets.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                  {rec.metricsComparison.originalBufferGets.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Buffer cache contention relief</p>
            </div>

            {/* Elapsed Time */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Estimated Elapsed Time
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  -{rec.metricsComparison.elapsedReductionPct}%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {rec.metricsComparison.estimatedElapsedSec}s
                </span>
                <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                  {rec.metricsComparison.originalElapsedSec}s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Per-execution latency reduction</p>
            </div>

            {/* Risk Assessment Score */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Change Risk Level
                </span>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                    rec.riskAssessment.level === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : rec.riskAssessment.level === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {rec.riskAssessment.level} RISK ({rec.riskAssessment.score}/100)
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">
                {rec.riskAssessment.lockingRisk}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Non-blocking ONLINE DDL execution</p>
            </div>
          </div>

          {/* Detected Bottlenecks Banner */}
          <div className="bg-amber-50 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-amber-900 dark:text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Identified Oracle Optimizer Bottlenecks:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {rec.detectedIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-white dark:bg-slate-950/70 p-2.5 rounded-lg border border-amber-200 dark:border-slate-800 text-slate-800 dark:text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="font-medium">{issue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explain Plan Comparison */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Oracle Execution Plan Comparison
                </h3>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActivePlanTab('both')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activePlanTab === 'both' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setActivePlanTab('original')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activePlanTab === 'original' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setActivePlanTab('optimized')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activePlanTab === 'optimized' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  AI Optimized
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(activePlanTab === 'both' || activePlanTab === 'original') && (
                <div className={activePlanTab === 'original' ? 'col-span-2' : ''}>
                  <ExplainPlanViewer plan={rec.originalPlan} title="Original Plan (Full Table Scan)" isOptimized={false} />
                </div>
              )}
              {(activePlanTab === 'both' || activePlanTab === 'optimized') && (
                <div className={activePlanTab === 'optimized' ? 'col-span-2' : ''}>
                  <ExplainPlanViewer plan={rec.optimizedPlan} title="AI Optimized Plan (Index Guided)" isOptimized={true} />
                </div>
              )}
            </div>
          </div>

          {/* Actionable Recommendations Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            {/* Tab Headers */}
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
                <button
                  onClick={() => setActiveCodeTab('rewrite')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCodeTab === 'rewrite'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  SQL Rewrite
                </button>
                <button
                  onClick={() => setActiveCodeTab('ddl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCodeTab === 'ddl'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Online Index DDL ({rec.recommendedDdl.length})
                </button>
                <button
                  onClick={() => setActiveCodeTab('hints')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCodeTab === 'hints'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  CBO Hints
                </button>
                <button
                  onClick={() => setActiveCodeTab('stats')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCodeTab === 'stats'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  DBMS_STATS
                </button>
                <button
                  onClick={() => setActiveCodeTab('spm')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCodeTab === 'spm'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  SPM Baseline
                </button>
                <button
                  onClick={() => setActiveCodeTab('risk')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCodeTab === 'risk'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Rollback &amp; Risk
                </button>
              </div>

              {/* Approval & Execute Button */}
              <div className="flex items-center gap-2">
                {rec.approvalStatus === 'APPLIED' ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Applied &amp; Verified in DB
                  </span>
                ) : (
                  <button
                    onClick={() => onApplyTuning(rec.id, rec.sqlId)}
                    disabled={isApplying}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Applying DDL &amp; Baseline...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Approve &amp; Apply Optimization</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-5">
              {/* 1. SQL Query Rewrite Tab */}
              {activeCodeTab === 'rewrite' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>AI Rationale:</strong> {rec.tuningRationale}
                    </div>
                    <button
                      onClick={() => copyToClipboard(rec.optimizedSql, 'rewrite')}
                      className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedSection === 'rewrite' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'rewrite' ? 'Copied!' : 'Copy Rewritten SQL'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{rec.optimizedSql}</code>
                  </pre>
                </div>
              )}

              {/* 2. DDL Online Index Tab */}
              {activeCodeTab === 'ddl' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Recommended non-blocking index definitions. Uses <code className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">ONLINE</code> to allow concurrent DML.
                    </p>
                    <button
                      onClick={() => copyToClipboard(rec.recommendedDdl.join('\n\n'), 'ddl')}
                      className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedSection === 'ddl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'ddl' ? 'Copied!' : 'Copy DDL'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-cyan-300 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{rec.recommendedDdl.join('\n\n')}</code>
                  </pre>
                </div>
              )}

              {/* 3. Optimizer Hints Tab */}
              {activeCodeTab === 'hints' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Direct CBO execution path enforcement via Oracle Cost-Based Optimizer hints:
                    </p>
                    <button
                      onClick={() => copyToClipboard(rec.recommendedHints.join(' '), 'hints')}
                      className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedSection === 'hints' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'hints' ? 'Copied!' : 'Copy Hints'}</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {rec.recommendedHints.map((hint, i) => (
                      <div key={i} className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 font-semibold">
                        <code>{hint}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Statistics Tab */}
              {activeCodeTab === 'stats' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Refresh object histograms and column selectivity using Oracle standard package <code className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">DBMS_STATS</code>:
                    </p>
                    <button
                      onClick={() => copyToClipboard(rec.statisticsCommands.join('\n\n'), 'stats')}
                      className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedSection === 'stats' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'stats' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{rec.statisticsCommands.join('\n\n')}</code>
                  </pre>
                </div>
              )}

              {/* 5. SQL Plan Baseline Tab */}
              {activeCodeTab === 'spm' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Pin the tuned execution plan into SQL Plan Management (SPM) using <code className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">DBMS_SPM</code>:
                    </p>
                    <button
                      onClick={() => copyToClipboard(rec.planBaselineCommand || '', 'spm')}
                      className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedSection === 'spm' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'spm' ? 'Copied!' : 'Copy SPM Command'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-purple-300 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{rec.planBaselineCommand || '-- No SPM command required'}</code>
                  </pre>
                </div>
              )}

              {/* 6. Rollback & Risk Tab */}
              {activeCodeTab === 'risk' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Production Change Risk Assessment:
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{rec.riskAssessment.impactSummary}</p>
                    <div className="pt-2 text-slate-600 dark:text-slate-400">
                      <strong>Locking Strategy:</strong> {rec.riskAssessment.lockingRisk}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback Commands:
                      </span>
                      <button
                        onClick={() => copyToClipboard(rec.riskAssessment.rollbackPlan, 'rollback')}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {copiedSection === 'rollback' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'rollback' ? 'Copied!' : 'Copy Rollback'}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-900 p-4 rounded-xl border border-rose-900/40 text-xs font-mono text-rose-300 overflow-x-auto leading-relaxed">
                      <code>{rec.riskAssessment.rollbackPlan}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
