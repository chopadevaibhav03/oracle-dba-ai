import React from 'react';
import { AlertOctagon, CheckCircle2, Flame, RotateCcw, X, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (scenario: 'HIGH_LOCK_CONTENTION' | 'SLOW_TABLE_SCAN_SPIKE' | 'NORMAL') => Promise<void>;
  isSimulating: boolean;
}

export const WorkloadSimulatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSimulate,
  isSimulating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Oracle Workload Anomaly Simulator</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Trigger real-time synthetic workload disruptions to observe Oracle AI DBA Sentinel detect, alert, and formulate autonomous tuning recommendations.
        </p>

        <div className="space-y-3">
          {/* Scenario 1: Row Lock Contention */}
          <button
            onClick={() => onSimulate('HIGH_LOCK_CONTENTION')}
            disabled={isSimulating}
            className="w-full text-left p-3.5 rounded-xl border border-slate-800 hover:border-rose-500/60 bg-slate-950/70 hover:bg-slate-950 transition-all flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-400 group-hover:scale-105 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-rose-300">
                Simulate `enq: TX - row lock contention`
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simulates batch transaction locking hot rows on ORDERS table. Injects blocker SID 142 blocking concurrent app workers.
              </p>
            </div>
          </button>

          {/* Scenario 2: Unindexed Full Table Scan Spike */}
          <button
            onClick={() => onSimulate('SLOW_TABLE_SCAN_SPIKE')}
            disabled={isSimulating}
            className="w-full text-left p-3.5 rounded-xl border border-slate-800 hover:border-amber-500/60 bg-slate-950/70 hover:bg-slate-950 transition-all flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-400 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300">
                Simulate Full Table Scan &amp; I/O Saturation
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Spikes `db file sequential read` to 58.2% and CPU to 94.8% due to unindexed queries on 12M customer rows.
              </p>
            </div>
          </button>

          {/* Scenario 3: Normal Baseline */}
          <button
            onClick={() => onSimulate('NORMAL')}
            disabled={isSimulating}
            className="w-full text-left p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/60 bg-slate-950/70 hover:bg-slate-950 transition-all flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                Restore Healthy Production Baseline
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clears lock contentions, normalizes CPU to ~48%, and restores buffer cache hit ratio to 98.7%.
              </p>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
