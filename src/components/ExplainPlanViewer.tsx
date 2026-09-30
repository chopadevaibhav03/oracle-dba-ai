import React, { useState } from 'react';
import { ExplainPlanStep } from '../types/oracle';
import { AlertTriangle, ChevronDown, ChevronRight, Database, FileText, Layers } from 'lucide-react';

interface Props {
  plan: ExplainPlanStep[];
  title?: string;
  isOptimized?: boolean;
}

export const ExplainPlanViewer: React.FC<Props> = ({ plan, title, isOptimized }) => {
  const [expandedDetails, setExpandedDetails] = useState<number | null>(null);

  const getWarningBadge = (warning?: string) => {
    switch (warning) {
      case 'FULL_TABLE_SCAN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            TABLE ACCESS FULL
          </span>
        );
      case 'CARTESIAN_JOIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            CARTESIAN PRODUCT
          </span>
        );
      case 'TEMP_SPILL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800/50">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            TEMP TABLESPACE SPILL
          </span>
        );
      case 'CARDINALITY_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-800/50">
            CARDINALITY SKEW
          </span>
        );
      default:
        return null;
    }
  };

  const getOperationBadgeColor = (operation: string) => {
    if (operation.includes('INDEX')) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';
    if (operation.includes('HASH JOIN')) return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50';
    if (operation.includes('NESTED LOOPS')) return 'text-blue-400 bg-blue-950/60 border-blue-800/50';
    if (operation.includes('SORT') || operation.includes('HASH')) return 'text-amber-400 bg-amber-950/60 border-amber-800/50';
    if (operation.includes('TABLE ACCESS FULL')) return 'text-rose-400 bg-rose-950/60 border-rose-800/50';
    return 'text-slate-300 bg-slate-800/60 border-slate-700/50';
  };

  const totalCost = plan.length > 0 ? plan[0].cost : 1;

  return (
    <div className={`rounded-xl border ${isOptimized ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 bg-slate-900/60'} overflow-hidden shadow-lg`}>
      {title && (
        <div className={`px-4 py-3 border-b flex items-center justify-between ${isOptimized ? 'border-emerald-500/20 bg-emerald-950/30' : 'border-slate-800 bg-slate-900/80'}`}>
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${isOptimized ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Root Cost: <strong className={isOptimized ? 'text-emerald-400' : 'text-amber-400'}>{plan[0]?.cost.toLocaleString() ?? 0}</strong></span>
            <span>Est Time: <strong className="text-slate-200">{plan[0]?.timeSec ?? 0}s</strong></span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Id</th>
              <th className="py-2.5 px-3 min-w-[280px]">Operation</th>
              <th className="py-2.5 px-3">Object Name</th>
              <th className="py-2.5 px-3 text-right">Rows</th>
              <th className="py-2.5 px-3 text-right">Cost (%CPU)</th>
              <th className="py-2.5 px-3 text-right">Time</th>
              <th className="py-2.5 px-3 text-center w-16">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {plan.map((step) => {
              const depth = step.parentId !== undefined ? (step.parentId === 0 ? 1 : 2) : 0;
              const costPct = Math.min(100, Math.round((step.cost / Math.max(totalCost, 1)) * 100));

              return (
                <React.Fragment key={step.id}>
                  <tr
                    className={`hover:bg-slate-800/40 transition-colors ${
                      expandedDetails === step.id ? 'bg-slate-800/30' : ''
                    } ${step.warning ? 'bg-rose-950/10' : ''}`}
                  >
                    <td className="py-2 px-3 text-center text-slate-500">{step.id}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 16}px` }}>
                        {depth > 0 && <span className="text-slate-600 font-sans">↳</span>}
                        <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${getOperationBadgeColor(step.operation)}`}>
                          {step.operation} {step.options ? `(${step.options})` : ''}
                        </span>
                        {step.warning && getWarningBadge(step.warning)}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {step.objectName ? (
                        <div className="flex items-center gap-1 text-slate-300">
                          <Database className="w-3 h-3 text-slate-500" />
                          <span className="font-semibold">{step.objectName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {step.cardinality.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium text-slate-200">{step.cost.toLocaleString()}</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isOptimized ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                            style={{ width: `${Math.max(5, costPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {step.timeSec}s
                    </td>
                    <td className="py-2 px-3 text-center">
                      {(step.accessPredicates || step.filterPredicates || step.warning) && (
                        <button
                          onClick={() => setExpandedDetails(expandedDetails === step.id ? null : step.id)}
                          className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                          title="View Predicates & Diagnostic Details"
                        >
                          {expandedDetails === step.id ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Predicate Information */}
                  {expandedDetails === step.id && (
                    <tr className="bg-slate-950/70 border-y border-slate-800">
                      <td colSpan={7} className="p-3 pl-8">
                        <div className="text-xs space-y-2 font-mono">
                          <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                            <FileText className="w-3.5 h-3.5" />
                            Predicate Information for Step {step.id} ({step.operation}):
                          </div>
                          {step.accessPredicates && (
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                              <span className="text-emerald-400 font-bold block mb-0.5">Access Predicates (Index Seek):</span>
                              <code className="text-slate-300 break-all">{step.accessPredicates}</code>
                            </div>
                          )}
                          {step.filterPredicates && (
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                              <span className="text-amber-400 font-bold block mb-0.5">Filter Predicates (Post-Scan Evaluation):</span>
                              <code className="text-slate-300 break-all">{step.filterPredicates}</code>
                            </div>
                          )}
                          {step.warning && (
                            <div className="text-rose-400 text-xs">
                              <strong>CBO Diagnostic Alert:</strong> {step.warning}. This operation is a primary candidate for query refactoring or indexing.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
