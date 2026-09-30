import React, { useState } from 'react';
import { DatabaseTarget, HitlActionRequest, OscapRule, VaptScanSummary } from '../types/oracle';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Lock,
  Play,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react';

interface Props {
  rules: OscapRule[];
  summary: VaptScanSummary | null;
  currentDb: DatabaseTarget;
  onRunScan: () => Promise<void>;
  onRemediateRule: (ruleId: string) => Promise<void>;
  onBatchRemediateAll: () => Promise<void>;
  onOpenTerminalWithCommand: (cmd: string) => void;
  onRequestHitlApproval?: (request: HitlActionRequest) => void;
  isScanning: boolean;
  isRemediating: boolean;
  onToast?: (message: string) => void;
}

export const VaptOscapSecurityView: React.FC<Props> = ({
  rules,
  summary,
  currentDb,
  onRunScan,
  onRemediateRule,
  onBatchRemediateAll,
  onOpenTerminalWithCommand,
  onRequestHitlApproval,
  isScanning,
  isRemediating,
  onToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remediatingRuleId, setRemediatingRuleId] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Domains' },
    { id: 'AUTHENTICATION', label: 'Authentication & Creds' },
    { id: 'ACCESS_CONTROL', label: 'Access Control & Grants' },
    { id: 'ENCRYPTION', label: 'Encryption & TDE' },
    { id: 'AUDITING', label: 'Unified Auditing' },
    { id: 'NETWORK', label: 'Network & Listener' },
  ];

  const filteredRules = rules.filter((rule) => {
    if (selectedCategory !== 'ALL' && rule.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && rule.status !== selectedStatus) return false;
    if (selectedSeverity !== 'ALL' && rule.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${rule.ruleCode} ${rule.title} ${rule.description} ${rule.benchmark}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const failedCount = rules.filter((r) => r.status === 'FAIL').length;
  const remediatedCount = rules.filter((r) => r.status === 'REMEDIATED').length;
  const passedCount = rules.filter((r) => r.status === 'PASS').length;
  const score = summary?.complianceScorePct ?? (rules.length > 0 ? Math.round(((passedCount + remediatedCount) / rules.length) * 100) : 100);

  const handleSingleRemediate = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    if (onRequestHitlApproval) {
      onRequestHitlApproval({
        id: `hitl-remediate-${rule.id}`,
        title: `Apply Hardening Remediation: ${rule.ruleCode} (${rule.title})`,
        actionType: 'OSCAP_REMEDIATE',
        riskLevel: rule.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        blastRadius: rule.description,
        database: currentDb.name,
        commands: rule.remediationScript.split('\n').filter(Boolean),
        rollbackCommand: rule.rollbackScript,
        initiator: 'DBA Operator (VAPT Hardening Suite)',
        payload: { ruleId: rule.id },
      });
      return;
    }

    setRemediatingRuleId(ruleId);
    try {
      await onRemediateRule(ruleId);
    } finally {
      setRemediatingRuleId(null);
    }
  };

  const handleBatchRemediateClick = () => {
    if (onRequestHitlApproval) {
      const failingRules = rules.filter((r) => r.status === 'FAIL');
      onRequestHitlApproval({
        id: `hitl-batch-remediate-${Date.now()}`,
        title: `Batch Hardening: Remediate ${failingRules.length} Failed OpenSCAP Benchmark Rules`,
        actionType: 'BATCH_REMEDIATE',
        riskLevel: 'CRITICAL',
        blastRadius: `Applies DDL and parameter hardening across ${failingRules.length} security categories in SPFILE and Data Dictionary.`,
        database: currentDb.name,
        commands: failingRules.flatMap((r) => r.remediationScript.split('\n').filter(Boolean)),
        rollbackCommand: '-- Multi-rule rollback commands available in DBA audit trail',
        initiator: 'DBA Operator (Batch Hardening)',
        payload: { batchAllFailed: true },
      });
      return;
    }

    onBatchRemediateAll();
  };

  const copyScript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onToast?.('Remediation script copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Top Security Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-red-950/80 border border-rose-200 dark:border-red-700/60 text-rose-600 dark:text-red-400 shadow-xs shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Automated VAPT &amp; OpenSCAP Compliance Suite
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-red-950 dark:text-red-300 border border-rose-300 dark:border-red-800">
                  CIS 19c Benchmark v1.1.0
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  DISA STIG
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Continuous security configuration auditing, credential vulnerability testing, and zero-downtime automated hardening remediations for Oracle 19c enterprise databases.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onRunScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning OSCAP Rules...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Run Automated VAPT Scan</span>
                </>
              )}
            </button>

            <button
              onClick={handleBatchRemediateClick}
              disabled={isRemediating || failedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
            >
              {isRemediating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Applying Remediations...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Automate All Remediations ({failedCount})</span>
                </>
              )}
            </button>

            <button
              onClick={() => onOpenTerminalWithCommand('vapt audit')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 font-mono text-xs font-bold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              title="Open DBA Terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>&gt;_ CLI</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Compliance Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">CIS Compliance Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl font-black tabular-nums ${
                score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-red-400'
              }`}
            >
              {score}%
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500">
              {score >= 90 ? 'Hardened' : score >= 70 ? 'Warning' : 'Vulnerable'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Failed / Vulnerable Findings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Failed (Action Required)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-600 dark:text-red-400 tabular-nums">{failedCount}</span>
            <span className="text-[11px] text-slate-500">Vulnerabilities</span>
          </div>
          <span className="text-[10px] text-rose-600 dark:text-red-400 font-mono mt-2">
            {failedCount > 0 ? 'Exposed to CIS finding' : 'Zero open findings'}
          </span>
        </div>

        {/* Remediated */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Automated Remediations</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{remediatedCount}</span>
            <span className="text-[11px] text-slate-500">Fixed &amp; Signed</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-2">Logged to dba_audit</span>
        </div>

        {/* Compliant / Passed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Passed Checks</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">{passedCount}</span>
            <span className="text-[11px] text-slate-500">of {rules.length} Rules</span>
          </div>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono mt-2">Profile Verified</span>
        </div>

        {/* Target Instance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between col-span-2 md:col-span-1 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Target Database</span>
          <div className="mt-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{currentDb.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">{currentDb.environment} • 19.18</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Oracle Net Link</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Dropdowns and Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule code, title, or keyword..."
              className="bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ALL">All Statuses ({rules.length})</option>
                <option value="FAIL">Failed Only ({failedCount})</option>
                <option value="REMEDIATED">Remediated ({remediatedCount})</option>
                <option value="PASS">Passing ({passedCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
            No security rules match the selected filter criteria.
          </div>
        ) : (
          filteredRules.map((rule) => {
            const isExpanded = expandedRuleId === rule.id;
            const isRuleRemediating = remediatingRuleId === rule.id;

            return (
              <div
                key={rule.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs transition-all ${
                  rule.status === 'FAIL'
                    ? 'border-rose-300 dark:border-red-900/60'
                    : rule.status === 'REMEDIATED'
                    ? 'border-emerald-300 dark:border-emerald-800/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Summary Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-cyan-700 dark:text-cyan-400">
                        {rule.ruleCode}
                      </span>

                      {/* Severity Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          rule.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 dark:bg-red-950 dark:text-red-300 border-rose-300 dark:border-red-800'
                            : rule.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : rule.severity === 'MEDIUM'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {rule.severity}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          rule.status === 'FAIL'
                            ? 'bg-rose-100 text-rose-800 dark:bg-red-950/80 dark:text-red-400 border-rose-300 dark:border-red-800'
                            : rule.status === 'REMEDIATED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-cyan-100 text-cyan-800 dark:bg-slate-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                        }`}
                      >
                        {rule.status === 'FAIL' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {rule.status === 'FAIL' ? 'VULNERABLE (FAIL)' : rule.status === 'REMEDIATED' ? 'REMEDIATED' : 'PASS'}
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        {rule.benchmark}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{rule.description}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {rule.status === 'FAIL' && (
                      <button
                        onClick={() => handleSingleRemediate(rule.id)}
                        disabled={isRuleRemediating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isRuleRemediating ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Wrench className="w-3 h-3" />
                        )}
                        <span>Remediate</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenTerminalWithCommand(rule.remediationScript)}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Run remediation script in DBA Terminal"
                    >
                      <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </button>

                    <button
                      onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Threat Rationale &amp; Security Impact
                      </h4>
                      <p className="text-slate-800 dark:text-slate-300 leading-relaxed">{rule.rationale}</p>
                    </div>

                    {/* Audit Query */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        OpenSCAP Audit Query (XCCDF Check)
                      </h4>
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-cyan-700 dark:text-cyan-300 flex items-center justify-between">
                        <code>{rule.auditQuery}</code>
                        <button
                          onClick={() => copyScript(rule.auditQuery, `${rule.id}-query`)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title="Copy query"
                        >
                          {copiedId === `${rule.id}-query` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remediation DDL / SQL */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Automated Remediation Script (DDL / SQL)
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenTerminalWithCommand(rule.remediationScript)}
                            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>Run in Terminal</span>
                          </button>
                          <button
                            onClick={() => copyScript(rule.remediationScript, `${rule.id}-fix`)}
                            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `${rule.id}-fix` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy Script</span>
                          </button>
                        </div>
                      </div>

                      <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                        {rule.remediationScript}
                      </pre>
                    </div>

                    {/* Rollback Script */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                        Emergency Rollback Script
                      </h4>
                      <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap">
                        {rule.rollbackScript}
                      </pre>
                    </div>

                    {rule.remediatedAt && (
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          Remediated on <strong>{rule.remediatedAt}</strong> by <strong>{rule.remediatedBy}</strong>. Audit trail entry signed.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
