import React from 'react';
import { DatabaseTarget, OracleMetric } from '../types/oracle';
import { LocalLlmConfig } from '../types/llm';
import { NavTabId } from './SidebarNav';
import {
  Activity,
  Bot,
  ChevronRight,
  Cpu,
  Flame,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Server,
  Sun,
  Terminal,
  UserCheck,
  Zap,
} from 'lucide-react';

interface Props {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeTab: NavTabId;
  currentDb: DatabaseTarget;
  metrics: OracleMetric | null;
  onOpenTerminal: () => void;
  onOpenSimulator: () => void;
  onOpenCopilot: () => void;
  leadLlmConfig?: LocalLlmConfig;
  onOpenLocalLlmModal?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  activeOperator?: string;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  onRefresh: () => void;
}

const TAB_TITLES: Record<NavTabId, string> = {
  dashboard: 'Oracle AI DBA Command Center & Telemetry',
  resources: 'Resources & Active Sessions (v$session & v$lock)',
  reports: 'HITL Dual-Custody Audit & Executive Dossier',
  budgets: 'Capacity Forecast & Workload Quotas',
  spend: 'DB Time & Workload Telemetry',
  tuner: 'Autonomous SQL Tuner Studio & CBO Optimizer',
  cost_opt: 'CBO Plan Baselines & Optimization',
  security: 'CIS Oracle 19c Hardening & VAPT Scanner',
  cloud_accounts: 'Tablespaces & Storage (dba_data_files)',
  team: 'DBA Operators & Dual-Custody Access',
  settings: 'Lead Model Engine (Ollama/vLLM & RAG)',
  support: 'Autonomous AI DBA Copilot Crew',
};

export const TopHeader: React.FC<Props> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeTab,
  currentDb,
  metrics,
  onOpenTerminal,
  onOpenSimulator,
  onOpenCopilot,
  leadLlmConfig,
  onOpenLocalLlmModal,
  theme = 'light',
  onToggleTheme,
  activeOperator = 'CHOPADE_V (Principal DBA)',
  isAutoRefresh,
  setIsAutoRefresh,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors px-4 py-2.5">
      <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Oracle AI DBA
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hidden sm:inline" />
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
              {currentDb.name}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-400 font-medium truncate hidden md:inline">
              {TAB_TITLES[activeTab]}
            </span>
          </div>
        </div>

        {/* Center / Right: Live Telemetry & Quick Launches */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Live Metrics Ticker */}
          {metrics && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1 text-[11px] font-mono">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">CPU:</span>
                <span
                  className={`font-bold ${
                    metrics.cpuUtilization > 85
                      ? 'text-rose-600 dark:text-rose-400'
                      : metrics.cpuUtilization > 70
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {metrics.cpuUtilization}%
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Buffer:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {metrics.bufferCacheHitRatio}%
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Sessions:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {metrics.activeSessions}
                </span>
              </div>
            </div>
          )}

          {/* Quick Terminal Launch */}
          <button
            onClick={onOpenTerminal}
            className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Open Interactive SQL*Plus & OpenSCAP DBA Terminal"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">&gt;_ Terminal</span>
          </button>

          {/* Copilot Crew Quick Access */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
            title="Open AI DBA Copilot Crew"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Operator Badge */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{activeOperator.split(' ')[0]}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
