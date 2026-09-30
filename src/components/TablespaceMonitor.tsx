import React, { useState } from 'react';
import { TablespaceInfo } from '../types/oracle';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  HardDrive,
  Plus,
  RefreshCw,
  Server,
  Terminal,
} from 'lucide-react';

interface Props {
  tablespaces: TablespaceInfo[];
  onRefresh: () => void;
}

export const TablespaceMonitor: React.FC<Props> = ({ tablespaces, onRefresh }) => {
  const [selectedTablespace, setSelectedTablespace] = useState<TablespaceInfo | null>(tablespaces[0] || null);
  const [copied, setCopied] = useState(false);

  const getAddDatafileScript = (tb: TablespaceInfo) => {
    return `-- Add high-performance ASM datafile to ${tb.name}
ALTER TABLESPACE ${tb.name} 
ADD DATAFILE '+DATA' 
SIZE 32G 
AUTOEXTEND ON NEXT 1G MAXSIZE 64G;

-- Verify datafile addition
SELECT file_name, bytes/1024/1024 AS size_mb, autoextensible 
FROM dba_data_files 
WHERE tablespace_name = '${tb.name}';`;
  };

  const copyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalStorageMB = tablespaces.reduce((acc, t) => acc + t.totalSizeMB, 0);
  const usedStorageMB = tablespaces.reduce((acc, t) => acc + t.usedSizeMB, 0);
  const overallPct = Math.round((usedStorageMB / Math.max(totalStorageMB, 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Oracle Tablespace &amp; ASM Storage Manager
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Monitoring High Water Marks, Free Space Extents, and Autoextend Thresholds across all 19c Containers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Allocated:</span>
              <strong className="text-slate-900 dark:text-white font-extrabold tabular-nums">
                {(totalStorageMB / 1024).toFixed(1)} GB
              </strong>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Used:</span>
              <strong className="text-amber-600 dark:text-amber-400 font-extrabold tabular-nums">
                {(usedStorageMB / 1024).toFixed(1)} GB ({overallPct}%)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tablespaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tablespaces.map((tb) => (
          <div
            key={tb.name}
            onClick={() => setSelectedTablespace(tb)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedTablespace?.name === tb.name
                ? 'bg-cyan-50/50 dark:bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive
                  className={`w-4 h-4 ${tb.pctUsed > 85 ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}
                />
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{tb.name}</span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                  tb.pctUsed > 85
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : tb.pctUsed > 75
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {tb.pctUsed}% USED
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between font-mono">
              <span>
                Type: <strong className="text-slate-800 dark:text-slate-200">{tb.type}</strong>
              </span>
              <span>
                Datafiles: <strong className="text-slate-800 dark:text-slate-200">{tb.datafileCount}</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden mb-2.5 border border-slate-200 dark:border-slate-800">
              <div
                className={`h-full ${
                  tb.pctUsed > 85 ? 'bg-rose-500' : tb.pctUsed > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${tb.pctUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>
                Used: <strong className="text-slate-800 dark:text-slate-200">{(tb.usedSizeMB / 1024).toFixed(1)} GB</strong>
              </span>
              <span>
                Free: <strong className="text-emerald-600 dark:text-emerald-400">{(tb.freeSizeMB / 1024).toFixed(1)} GB</strong>
              </span>
              <span>Total: {(tb.totalSizeMB / 1024).toFixed(1)} GB</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Tablespace Inspector & DDL Generator */}
      {selectedTablespace && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                DBA Storage Expansion Script Generator for <span className="text-cyan-600 dark:text-cyan-400 font-mono">{selectedTablespace.name}</span>
              </h3>
            </div>
            <button
              onClick={() => copyScript(getAddDatafileScript(selectedTablespace))}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Oracle Best Practice: Ensure ASM disk groups have equal allocation sizes. Autoextend increment of 1GB prevents catalog fragmentation during rapid bulk inserts.
          </p>

          <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
            <code>{getAddDatafileScript(selectedTablespace)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
