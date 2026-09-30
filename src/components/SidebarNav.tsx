import React from 'react';
import { DatabaseTarget } from '../types/oracle';
import { LocalLlmConfig } from '../types/llm';
import {
  AlertTriangle,
  ArrowDownRight,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  DollarSign,
  FileText,
  Flame,
  HardDrive,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Moon,
  PieChart,
  RefreshCw,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'resources'
  | 'reports'
  | 'budgets'
  | 'spend'
  | 'tuner'
  | 'cost_opt'
  | 'security'
  | 'cloud_accounts'
  | 'team'
  | 'settings'
  | 'support';

export interface SidebarNavProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  databases: DatabaseTarget[];
  currentDb: DatabaseTarget;
  setCurrentDb: (db: DatabaseTarget) => void;
  vaptFailedCount?: number;
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

interface NavItemConfig {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  isOpen,
  onToggleOpen,
  activeTab,
  setActiveTab,
  databases,
  currentDb,
  setCurrentDb,
  vaptFailedCount = 0,
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
  const menuItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'DBA Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'tuner',
      label: 'SQL Tuner Studio',
      icon: Cpu,
    },
    {
      id: 'resources',
      label: 'Sessions & Locks (v$session)',
      icon: Server,
    },
    {
      id: 'cloud_accounts',
      label: 'Tablespaces & Storage',
      icon: HardDrive,
    },
    {
      id: 'security',
      label: 'CIS 19c & VAPT Hardening',
      icon: ShieldAlert,
      badge: vaptFailedCount > 0 ? `${vaptFailedCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'reports',
      label: 'HITL Approvals & Audit',
      icon: FileText,
    },
    {
      id: 'support',
      label: 'Autonomous Copilot Crew',
      icon: Bot,
    },
    {
      id: 'settings',
      label: 'Lead Model Engine',
      icon: Settings,
    },
  ];

  const renderContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 select-none text-xs">
      {/* Top Header: Logo on left, Collapse Arrow on right */}
      <div className="h-14 px-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className={`flex items-center gap-2.5 min-w-0 ${!isOpen && !isMobile ? 'mx-auto' : ''}`}>
          {/* Oracle Autonomous DBA Sentinel Logo */}
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-2xs">
            <Database className="w-4 h-4 stroke-[2.2]" />
          </div>
          {(isOpen || isMobile) && (
            <div className="min-w-0 flex flex-col">
              <span className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Oracle AI DBA
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Autonomous Sentinel
              </span>
            </div>
          )}
        </div>

        {/* Small collapse toggle arrow '<' (or '>' when closed) */}
        {(isOpen || isMobile) && (
          <button
            onClick={onToggleOpen}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse sidebar menu"
            aria-label="Collapse sidebar menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When collapsed on desktop: small expand '>' button */}
      {!isOpen && !isMobile && (
        <div className="py-2 border-b border-slate-200 dark:border-slate-800 flex justify-center">
          <button
            onClick={onToggleOpen}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Expand sidebar menu"
            aria-label="Expand sidebar menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Database Target Selector */}
      <div className={`p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 ${isOpen || isMobile ? 'block' : 'flex justify-center'}`}>
        {isOpen || isMobile ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Database Instance</span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
            <select
              value={currentDb.id}
              onChange={(e) => {
                const found = databases.find((d) => d.id === e.target.value);
                if (found) setCurrentDb(found);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 rounded-md py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer transition-colors"
            >
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name} ({db.type})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button
            onClick={onToggleOpen}
            className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 relative hover:border-sky-500 transition-colors cursor-pointer"
            title={`Active: ${currentDb.name}`}
          >
            <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        )}
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5">
        {(isOpen || isMobile) && (
          <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            MENU
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) onToggleOpen();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group relative ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              } ${!isOpen && !isMobile ? 'justify-center px-0 h-10' : ''}`}
              title={!isOpen && !isMobile ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
              />

              {(isOpen || isMobile) && (
                <span className="truncate text-xs flex-1">{item.label}</span>
              )}

              {item.badge && (isOpen || isMobile) && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                    item.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Autonomous DBA Tools Footer */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 space-y-1 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
        <button
          onClick={() => {
            onOpenTerminal();
            if (isMobile) onToggleOpen();
          }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
            !isOpen && !isMobile ? 'justify-center px-0 h-9' : ''
          }`}
          title="Open SQL*Plus & DBA Terminal"
        >
          <Terminal className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          {(isOpen || isMobile) && <span>&gt;_ DBA Terminal</span>}
        </button>

        <button
          onClick={() => {
            onOpenCopilot();
            if (isMobile) onToggleOpen();
          }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
            !isOpen && !isMobile ? 'justify-center px-0 h-9' : ''
          }`}
          title="Open AI DBA Copilot"
        >
          <Bot className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          {(isOpen || isMobile) && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="truncate">AI DBA Crew</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </button>

        {/* Theme and Refresh Bar */}
        <div className={`pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 ${!isOpen && !isMobile ? 'flex-col' : ''}`}>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          )}

          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`p-1.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1 ${
              isAutoRefresh
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-400'
            }`}
            title={isAutoRefresh ? 'Auto-sync active (4s)' : 'Auto-sync paused'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefresh ? 'animate-spin-slow' : ''}`} />
            {(isOpen || isMobile) && <span>{isAutoRefresh ? 'Auto' : 'Off'}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-30 transition-all duration-200 ${
          isOpen ? 'w-56' : 'w-16'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer from Left */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex animate-in fade-in duration-150">
          <div className="w-64 bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </div>
          <div className="flex-1" onClick={onToggleOpen} />
        </div>
      )}
    </>
  );
};
