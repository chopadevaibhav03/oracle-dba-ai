import React from 'react';
import { DatabaseTarget, OracleMetric } from '../types/oracle';
import { LocalLlmConfig } from '../types/llm';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Layers,
  Moon,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  Sun,
  Terminal,
  UserCheck,
  Zap,
} from 'lucide-react';

interface Props {
  activeTab: 'dashboard' | 'tuner' | 'sessions' | 'tablespaces' | 'audit' | 'security';
  setActiveTab: (tab: 'dashboard' | 'tuner' | 'sessions' | 'tablespaces' | 'audit' | 'security') => void;
  databases: DatabaseTarget[];
  currentDb: DatabaseTarget;
  setCurrentDb: (db: DatabaseTarget) => void;
  metrics: OracleMetric | null;
  onOpenCopilot: () => void;
  onOpenSimulator: () => void;
  onOpenTerminal: () => void;
  vaptFailedCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  activeOperator?: string;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  onRefresh: () => void;
  leadLlmConfig?: LocalLlmConfig;
  onOpenLocalLlmModal?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  databases,
  currentDb,
  setCurrentDb,
  metrics,
  onOpenCopilot,
  onOpenSimulator,
  onOpenTerminal,
  vaptFailedCount = 0,
  theme = 'dark',
  onToggleTheme,
  activeOperator = 'CHOPADE_V (Principal DBA)',
  isAutoRefresh,
  setIsAutoRefresh,
  onRefresh,
  leadLlmConfig,
  onOpenLocalLlmModal,
}) => {
  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 backdrop-blur transition-colors">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & DB Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-red-600 flex items-center justify-center shadow-lg shadow-cyan-950/20 border border-cyan-400/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">ORACLE AI DBA</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40">
                  SENTINEL
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Autonomous Performance &amp; Security Crew</span>
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">19c Enterprise</span>
              </div>
            </div>
          </div>

          {/* Database Target Selector */}
          <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200 dark:border-slate-800">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentDb.id}
              onChange={(e) => {
                const found = databases.find((d) => d.id === e.target.value);
                if (found) setCurrentDb(found);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-md py-1 px-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name} ({db.type})
                </option>
              ))}
            </select>
            <span
              className={`w-2 h-2 rounded-full ${
                currentDb.status === 'HEALTHY'
                  ? 'bg-emerald-400'
                  : currentDb.status === 'WARNING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400 animate-ping'
              }`}
            />
          </div>
        </div>

        {/* Center / Right: Live KPIs & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Operator Badge */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">{activeOperator}</span>
          </div>

          {metrics && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">CPU:</span>
                <span
                  className={`font-bold ${
                    metrics.cpuUtilization > 85
                      ? 'text-rose-500 dark:text-rose-400'
                      : metrics.cpuUtilization > 70
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {metrics.cpuUtilization}%
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Buffer:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{metrics.bufferCacheHitRatio}%</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Sessions:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{metrics.activeSessions}</span>
              </div>
            </div>
          )}

          {/* Theme Switcher Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          )}

          {/* Interactive DBA Terminal Button */}
          <button
            onClick={onOpenTerminal}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 shadow-xs transition-all cursor-pointer"
            title="Open Interactive Oracle DBA & OpenSCAP Terminal"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden sm:inline">&gt;_ Terminal</span>
          </button>

          {/* Lead Model Engine Button (Ollama / vLLM / LangChain) */}
          {onOpenLocalLlmModal && (
            <button
              onClick={onOpenLocalLlmModal}
              className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 transition-all cursor-pointer"
              title={`Lead Model: ${leadLlmConfig?.modelName || 'Local LLM'} (${leadLlmConfig?.provider?.toUpperCase() || 'OLLAMA'}). Click to configure LangChain & RAG.`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden xl:inline text-[11px]">
                Lead: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{leadLlmConfig?.modelName?.split(':')[0] || 'Ollama'}</strong>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  leadLlmConfig?.isConnected !== false
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-400'
                }`}
                title={leadLlmConfig?.isConnected !== false ? 'Lead Model Connected' : 'Connecting'}
              />
            </button>
          )}

          {/* Workload Simulator Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Inject load or lock contention to test AI Sentinel"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Simulate</span>
          </button>

          {/* AI DBA Co-pilot Chat Button */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/20 transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Crew</span>
          </button>

          {/* Auto Refresh & Manual Refresh */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                isAutoRefresh ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={isAutoRefresh ? 'Auto-refresh ON (every 4s)' : 'Auto-refresh PAUSED'}
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={onRefresh}
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh now"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-3 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Performance &amp; Metrics
          </button>

          <button
            onClick={() => setActiveTab('tuner')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tuner'
                ? 'text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            SQL Tuner Studio
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              AI Auto
            </span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border-b-2 border-red-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>VAPT &amp; OpenSCAP</span>
            {vaptFailedCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40">
                {vaptFailedCount} Vulns
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                Hardened
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sessions'
                ? 'text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sessions &amp; Lock Tree
          </button>

          <button
            onClick={() => setActiveTab('tablespaces')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tablespaces'
                ? 'text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Tablespaces &amp; ASM
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Approval &amp; Audit Trail
          </button>
        </div>
      </div>
    </header>
  );
};


