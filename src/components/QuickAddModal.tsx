import React from 'react';
import {
  AlertTriangle,
  Bot,
  Cpu,
  Database,
  FileDown,
  Flame,
  HardDrive,
  Plus,
  RotateCcw,
  ShieldAlert,
  Terminal,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export const QuickAddModal: React.FC<Props> = ({ isOpen, onClose, onSelectAction }) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'tune_sql',
      title: 'Tune Slow SQL Query with AI',
      description: 'Analyze execution plans, generate CBO hints, and synthesize online composite indexes.',
      icon: Cpu,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
    },
    {
      id: 'simulate_workload',
      title: 'Inject Workload Simulation',
      description: 'Trigger artificial row lock contentions or full table scans to test automated triage.',
      icon: Flame,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    },
    {
      id: 'run_vapt',
      title: 'Run Automated VAPT & CIS Scan',
      description: 'Audit 15 security configuration rules against CIS 19c Benchmark and DISA STIG standards.',
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    },
    {
      id: 'expand_storage',
      title: 'Add 32GB ASM Datafile to Tablespace',
      description: 'Generate and verify non-blocking DDL to extend database storage allocation.',
      icon: HardDrive,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'open_terminal',
      title: 'Launch Interactive DBA Terminal',
      description: 'Direct SQL*Plus and OpenSCAP CLI access with syntax highlighting and command history.',
      icon: Terminal,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800',
    },
    {
      id: 'generate_pdf',
      title: 'Generate Executive PDF Dossier',
      description: 'Export immutable SOX-404 audit trail and compliance status report for management.',
      icon: FileDown,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose an optimization or administrative action</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all cursor-pointer group"
              >
                <div className={`p-2 rounded-lg border shrink-0 ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {act.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {act.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
