import React, { useState } from 'react';
import { DatabaseTarget, HitlActionRequest, TuningAuditEntry, TuningRecommendation } from '../types/oracle';
import { TuningAuditPdfModal } from './TuningAuditPdfModal';
import { generateTuningAuditPdf } from '../utils/pdfGenerator';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  FileCheck,
  FileDown,
  FileText,
  Printer,
  RotateCcw,
  ShieldCheck,
  Terminal,
  User,
  Zap,
} from 'lucide-react';

interface Props {
  auditLog: TuningAuditEntry[];
  tuningRecommendation: TuningRecommendation | null;
  onApplyPendingTuning: (recId: string, sqlId: string) => Promise<void>;
  isApplying: boolean;
  currentDb?: DatabaseTarget;
  onToast?: (message: string) => void;
  onRequestHitlApproval?: (request: HitlActionRequest) => void;
}

export const ApprovalAuditConsole: React.FC<Props> = ({
  auditLog,
  tuningRecommendation,
  onApplyPendingTuning,
  isApplying,
  currentDb,
  onToast,
  onRequestHitlApproval,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);

  const copyRollback = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyClick = (recId: string, sqlId: string) => {
    if (onRequestHitlApproval && pendingRec) {
      onRequestHitlApproval({
        id: `hitl-tuning-${recId}`,
        title: `Apply SQL Tuning Plan & Online Index for SQL ${sqlId}`,
        actionType: 'APPLY_TUNING',
        riskLevel: pendingRec.riskAssessment.level as any,
        blastRadius: pendingRec.riskAssessment.impactSummary,
        database: currentDb?.name || 'PROD_RAC01 (PDB_FIN_CORE)',
        commands: pendingRec.recommendedDdl.concat(pendingRec.statisticsCommands || []),
        rollbackCommand: pendingRec.riskAssessment.rollbackPlan,
        initiator: 'DBA Operator (Approval Console)',
        payload: { recommendationId: recId, sqlId },
      });
      return;
    }

    onApplyPendingTuning(recId, sqlId);
  };

  const handleQuickDownloadPdf = () => {
    try {
      setIsDirectDownloading(true);
      const doc = generateTuningAuditPdf(auditLog, {
        database: currentDb,
      });
      const cleanDbName = currentDb?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'OracleDB';
      const today = new Date().toISOString().split('T')[0];
      const filename = `DBA_Tuning_Audit_Report_${cleanDbName}_${today}.pdf`;
      doc.save(filename);
      onToast?.(`Downloaded PDF summary report: ${filename}`);
    } catch (err: any) {
      console.error('Quick PDF download error:', err);
      alert(`Could not generate PDF: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDirectDownloading(false);
    }
  };

  const pendingRec = tuningRecommendation && tuningRecommendation.approvalStatus === 'PENDING_APPROVAL' ? tuningRecommendation : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Enterprise DBA Approval Console &amp; Audit Trail
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Every tuning change, DDL index generation, and SQL Plan Baseline is signed, risk-assessed, and logged for SOX &amp; HIPAA database compliance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono shrink-0">
            <div className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Logged Actions:</span>
              <strong className="text-slate-900 dark:text-white tabular-nums">{auditLog.length} Operations</strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Compliance Status:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">100% Verified</strong>
            </div>

            {/* Quick Export Button */}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              title="Open Printable PDF Status Meeting Dossier"
            >
              <FileDown className="w-4 h-4" />
              <span>Meeting PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Approval Widget if any */}
      {pendingRec && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/50 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                  ACTION REQUIRED
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Tuning Plan Pending Sign-Off for SQL_ID: <span className="font-mono text-cyan-700 dark:text-cyan-300">{pendingRec.sqlId}</span>
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Predicted Improvement: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">-{pendingRec.metricsComparison.costReductionPct}% CBO Cost</strong> (from {pendingRec.metricsComparison.originalElapsedSec}s down to {pendingRec.metricsComparison.estimatedElapsedSec}s).
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Risk Score: <strong>{pendingRec.riskAssessment.score}/100 ({pendingRec.riskAssessment.level} RISK)</strong> • Non-blocking ONLINE DDL
              </div>
            </div>

            <button
              onClick={() => handleApplyClick(pendingRec.id, pendingRec.sqlId)}
              disabled={isApplying}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isApplying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Applying DDL &amp; Baseline...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Approve &amp; Apply to Production</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Immutable Audit Trail History (dba_audit_trail)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickDownloadPdf}
              disabled={isDirectDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Fast export current audit entries directly to PDF"
            >
              {isDirectDownloading ? (
                <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              )}
              <span>Quick PDF</span>
            </button>

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Open Printable Meeting Dossier & PDF Generator"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Meeting PDF &amp; Print</span>
            </button>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">• Live DB Sync</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">SQL ID</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4 text-right">Improvement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes &amp; Details</th>
                <th className="py-3 px-4 text-center">Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {auditLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{entry.executedAt}</td>
                  <td className="py-3 px-4 font-bold text-cyan-700 dark:text-cyan-400">{entry.sqlId}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-sans font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{entry.executedBy}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                      {entry.actionType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{entry.measuredImprovementPct}%
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-sm">
                    <p className="line-clamp-2">{entry.notes}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => copyRollback(entry.rollbackCommand, entry.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Copy Rollback Command"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tuning Audit PDF & Printable Report Modal */}
      <TuningAuditPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        auditLog={auditLog}
        currentDb={currentDb}
        onToast={onToast}
      />
    </div>
  );
};
