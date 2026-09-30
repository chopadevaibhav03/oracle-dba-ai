import React, { useState } from 'react';
import { HitlActionRequest, OracleSession } from '../types/oracle';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Unlock,
  User,
  Zap,
} from 'lucide-react';

interface Props {
  sessions: OracleSession[];
  onKillSession: (sid: number, serial: number) => Promise<void>;
  onRefresh: () => void;
  onSelectSqlIdForTuning: (sqlId: string) => void;
  onRequestHitlApproval?: (request: HitlActionRequest) => void;
}

export const SessionsLocksView: React.FC<Props> = ({
  sessions,
  onKillSession,
  onRefresh,
  onSelectSqlIdForTuning,
  onRequestHitlApproval,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [killingSid, setKillingSid] = useState<number | null>(null);

  // Identify blockers
  const blockers = sessions.filter((s) =>
    sessions.some((other) => other.blockingSid === s.sid)
  );

  const filteredSessions = sessions.filter(
    (s) =>
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.sqlId && s.sqlId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleKill = async (sid: number, serial: number) => {
    const session = sessions.find((s) => s.sid === sid);
    if (onRequestHitlApproval) {
      onRequestHitlApproval({
        id: `hitl-kill-${sid}`,
        title: `Terminate Oracle Production Session SID: ${sid}, SERIAL#: ${serial}`,
        actionType: 'KILL_SESSION',
        riskLevel: 'HIGH',
        blastRadius: `Terminates active database process for user '${session?.username || 'SYSTEM'}'. Unblocks waiting transactions; client connection receives ORA-00028.`,
        database: 'PROD_RAC01 (PDB_FIN_CORE)',
        commands: [`ALTER SYSTEM KILL SESSION '${sid},${serial}' IMMEDIATE;`],
        rollbackCommand: '-- Session termination cannot be rolled back',
        initiator: 'DBA Operator (Sessions & Lock Tree)',
        payload: { sid, serial },
      });
      return;
    }

    setKillingSid(sid);
    try {
      await onKillSession(sid, serial);
    } finally {
      setKillingSid(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Blocker Alert */}
      {blockers.length > 0 ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-rose-900 dark:text-white tracking-tight">
                    Active Row Lock Contention Detected
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                    enq: TX - row lock contention
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 mt-1">
                  <strong>SID {blockers.map((b) => b.sid).join(', ')}</strong> is holding an Exclusive Row Lock (Mode 6) blocking concurrent transactions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {blockers.map((b) => (
                <button
                  key={b.sid}
                  onClick={() => handleKill(b.sid, b.serial)}
                  disabled={killingSid === b.sid}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kill Blocker SID {b.sid}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>No exclusive lock blockers detected. All session latches operating cleanly.</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">v$lock inspection: NORMAL</span>
        </div>
      )}

      {/* Lock Tree Visualization */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Oracle Lock Hierarchy (Blocker &rarr; Waiting Sessions)
            </h3>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Locks
          </button>
        </div>

        {blockers.length > 0 ? (
          <div className="space-y-4 font-mono text-xs">
            {blockers.map((blocker) => {
              const waitingForBlocker = sessions.filter((s) => s.blockingSid === blocker.sid);
              return (
                <div
                  key={blocker.sid}
                  className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  {/* Blocker Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">
                        ROOT BLOCKER
                      </span>
                      <span className="text-slate-900 dark:text-white font-extrabold">SID: {blocker.sid}</span>
                      <span className="text-slate-500">(Serial# {blocker.serial})</span>
                      <span className="text-slate-700 dark:text-slate-300 font-sans">
                        • User: <strong>{blocker.username}</strong>
                      </span>
                      <span className="text-slate-500 font-sans">• Program: {blocker.program}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {blocker.sqlId && (
                        <button
                          onClick={() => onSelectSqlIdForTuning(blocker.sqlId!)}
                          className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          SQL: {blocker.sqlId}
                        </button>
                      )}
                      <button
                        onClick={() => handleKill(blocker.sid, blocker.serial)}
                        disabled={killingSid === blocker.sid}
                        className="text-xs px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
                      >
                        Kill Session
                      </button>
                    </div>
                  </div>

                  {/* Waiters Tree */}
                  <div className="pl-4 sm:pl-6 space-y-2 border-l-2 border-slate-300 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block font-sans">
                      Waiting Sessions Blocked on TX Lock ({waitingForBlocker.length}):
                    </span>
                    {waitingForBlocker.map((waiter) => (
                      <div
                        key={waiter.sid}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">↳</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">SID: {waiter.sid}</span>
                          <span className="text-slate-600 dark:text-slate-300 font-sans font-medium">
                            ({waiter.username})
                          </span>
                          <span className="text-slate-500 font-sans text-[11px]">• {waiter.program}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold tabular-nums">
                            <Clock className="w-3.5 h-3.5" />
                            Wait: {waiter.secondsInWait}s
                          </span>
                          {waiter.sqlId && (
                            <button
                              onClick={() => onSelectSqlIdForTuning(waiter.sqlId!)}
                              className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                            >
                              SQL: {waiter.sqlId}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
            No lock contentions currently detected in the database instance.
          </div>
        )}
      </div>

      {/* Full v$session Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Active Database Sessions (v$session)</h3>
            <span className="text-xs text-slate-500 font-bold">({filteredSessions.length} sessions)</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search user, sql_id, event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">SID, Serial#</th>
                <th className="py-3 px-4">User / Machine</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Wait Event</th>
                <th className="py-3 px-4 text-right">Wait (s)</th>
                <th className="py-3 px-4">SQL ID</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredSessions.map((s) => (
                <tr key={s.sid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {s.sid}, {s.serial}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-bold text-cyan-700 dark:text-cyan-400">{s.username}</div>
                    <div className="text-[11px] text-slate-500">{s.machine}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-xs">{s.program}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className={s.event.includes('lock') ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                      {s.event}
                    </div>
                    <div className="text-[11px] text-slate-500">{s.waitClass}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {s.secondsInWait}s
                  </td>
                  <td className="py-3 px-4">
                    {s.sqlId ? (
                      <button
                        onClick={() => onSelectSqlIdForTuning(s.sqlId!)}
                        className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                      >
                        {s.sqlId}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleKill(s.sid, s.serial)}
                      disabled={killingSid === s.sid}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                      title="ALTER SYSTEM KILL SESSION"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
