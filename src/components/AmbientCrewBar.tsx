import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react';
import { DatabaseTarget, HitlActionRequest, OracleMetric } from '../types/oracle';
import { LocalLlmConfig } from '../types/llm';

interface Props {
  activeTab: string;
  metrics: OracleMetric | null;
  currentDb: DatabaseTarget;
  vaptFailedCount: number;
  onOpenCopilot: () => void;
  onOpenTerminal: (cmd?: string) => void;
  onRequestHitlApproval: (request: HitlActionRequest) => void;
  leadLlmConfig?: LocalLlmConfig;
  onOpenLocalLlmModal?: () => void;
}

export const AmbientCrewBar: React.FC<Props> = ({
  activeTab,
  metrics,
  currentDb,
  vaptFailedCount,
  onOpenCopilot,
  onOpenTerminal,
  onRequestHitlApproval,
  leadLlmConfig,
  onOpenLocalLlmModal,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine ambient suggestion based on active context
  let suggestion = {
    agent: 'Archibald (CBO Tuner)',
    avatar: '🧠',
    text: 'AWR telemetry indicates stable CBO plans on FIN_CORE.',
    actionLabel: 'Inspect SQL Plans',
    action: () => onOpenCopilot(),
  };

  if (activeTab === 'sessions') {
    suggestion = {
      agent: 'Archibald (AWR Triage)',
      avatar: '🧠',
      text: 'Blocker SID 142 is holding an exclusive row lock on ORDERS, stalling 2 sessions.',
      actionLabel: 'Authorize Blocker Termination',
      action: () => {
        onRequestHitlApproval({
          id: `hitl-${Date.now()}`,
          title: 'Terminate Blocker Session SID 142,39812',
          actionType: 'KILL_SESSION',
          riskLevel: 'HIGH',
          blastRadius: 'Releases TX row lock; client application process receives ORA-00028.',
          database: currentDb.name,
          commands: [`ALTER SYSTEM KILL SESSION '142,39812' IMMEDIATE;`],
          rollbackCommand: '-- Session termination cannot be rolled back',
          initiator: 'AI Copilot Crew (Archibald)',
          payload: { sid: 142, serial: 39812 },
        });
      },
    };
  } else if (activeTab === 'security' || vaptFailedCount > 0) {
    suggestion = {
      agent: 'Seraphina (Security Sentinel)',
      avatar: '🛡️',
      text: `${vaptFailedCount} open CIS 19c findings detected. REMOTE_OS_AUTHENT needs immediate SPFILE hardening.`,
      actionLabel: 'Authorize SPFILE Hardening',
      action: () => {
        onRequestHitlApproval({
          id: `hitl-${Date.now()}`,
          title: 'Apply CIS Benchmark Hardening: CIS-ORA19-1.1',
          actionType: 'OSCAP_REMEDIATE',
          riskLevel: 'CRITICAL',
          blastRadius: 'Sets REMOTE_OS_AUTHENT=FALSE in SPFILE. Disables password-less OS authentication.',
          database: currentDb.name,
          commands: [`ALTER SYSTEM SET REMOTE_OS_AUTHENT=FALSE SCOPE=SPFILE;`],
          rollbackCommand: `ALTER SYSTEM SET REMOTE_OS_AUTHENT=TRUE SCOPE=SPFILE;`,
          initiator: 'AI Copilot Crew (Seraphina)',
          payload: { ruleId: 'rule-cis-1-1' },
        });
      },
    };
  } else if (activeTab === 'tuner') {
    suggestion = {
      agent: 'Archibald (CBO Tuner)',
      avatar: '🧠',
      text: 'SQL 8f7q2m8x9p31a cost can be reduced by 84.6% via Function-Based Index.',
      actionLabel: 'Launch SQL Tuning',
      action: () => onOpenCopilot(),
    };
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40 print:hidden flex items-center gap-2">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 dark:bg-slate-900/95 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xl border border-cyan-500/40 backdrop-blur-md transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>AI DBA Crew Active</span>
          {leadLlmConfig && (
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
              Lead: {leadLlmConfig.modelName.split(':')[0]}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-xl z-40 print:hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/20 backdrop-blur-md text-xs transition-colors">
        <div className="flex items-center justify-between gap-3">
          
          {/* Agent Badge & Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs text-sm">
              {suggestion.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                  {suggestion.agent}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 shrink-0">
                  Crew Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {suggestion.text}
              </p>
            </div>
          </div>

          {/* Action & Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={suggestion.action}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              {suggestion.actionLabel}
            </button>

            <button
              onClick={onOpenCopilot}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Open full Copilot conversation"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Minimize Copilot Crew Bar"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
