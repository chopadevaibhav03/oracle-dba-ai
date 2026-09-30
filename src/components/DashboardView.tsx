import React, { useState } from 'react';
import { DatabaseTarget, OracleMetric, SlowQuery, TablespaceInfo, WaitEvent } from '../types/oracle';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Database,
  Download,
  Filter,
  Flame,
  HardDrive,
  Info,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface Props {
  metrics: OracleMetric | null;
  waitEvents: WaitEvent[];
  slowQueries: SlowQuery[];
  tablespaces: TablespaceInfo[];
  currentDb: DatabaseTarget;
  onSelectQueryForTuning: (query: SlowQuery) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenQuickActionModal?: () => void;
}

export const DashboardView: React.FC<Props> = ({
  metrics,
  waitEvents,
  slowQueries,
  tablespaces,
  currentDb,
  onSelectQueryForTuning,
  onNavigateToTab,
  onOpenQuickActionModal,
}) => {
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'line'>('bar');
  const [selectedMetricView, setSelectedMetricView] = useState<'dbTime' | 'cpu' | 'iops'>('dbTime');
  const [selectedInstanceFilter, setSelectedInstanceFilter] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-semibold text-sm">Loading Oracle AI DBA Telemetry...</span>
      </div>
    );
  }

  // 30 days AWR snapshot workload series (DB Time, CPU, IOPS, and Active Sessions)
  const workloadHistory = [
    { day: 1, date: 'Aug 31', dbTimeSec: 1420, cpuPct: 41, iops: 8200, activeSessions: 24 },
    { day: 2, date: 'Sep 01', dbTimeSec: 1350, cpuPct: 38, iops: 7900, activeSessions: 22 },
    { day: 3, date: 'Sep 02', dbTimeSec: 1510, cpuPct: 44, iops: 8600, activeSessions: 26 },
    { day: 4, date: 'Sep 03', dbTimeSec: 1480, cpuPct: 42, iops: 8350, activeSessions: 25 },
    { day: 5, date: 'Sep 04', dbTimeSec: 1650, cpuPct: 48, iops: 9100, activeSessions: 29 },
    { day: 6, date: 'Sep 05', dbTimeSec: 1220, cpuPct: 34, iops: 7100, activeSessions: 20 },
    { day: 7, date: 'Sep 06', dbTimeSec: 1190, cpuPct: 32, iops: 6900, activeSessions: 19 },
    { day: 8, date: 'Sep 07', dbTimeSec: 1540, cpuPct: 45, iops: 8800, activeSessions: 27 },
    { day: 9, date: 'Sep 08', dbTimeSec: 1490, cpuPct: 43, iops: 8400, activeSessions: 25 },
    { day: 10, date: 'Sep 09', dbTimeSec: 1520, cpuPct: 44, iops: 8550, activeSessions: 26 },
    { day: 11, date: 'Sep 10', dbTimeSec: 1720, cpuPct: 52, iops: 9400, activeSessions: 32 },
    { day: 12, date: 'Sep 11', dbTimeSec: 1580, cpuPct: 46, iops: 8900, activeSessions: 28 },
    { day: 13, date: 'Sep 12', dbTimeSec: 1260, cpuPct: 36, iops: 7300, activeSessions: 21 },
    { day: 14, date: 'Sep 13', dbTimeSec: 1180, cpuPct: 31, iops: 6800, activeSessions: 18 },
    { day: 15, date: 'Sep 14', dbTimeSec: 1530, cpuPct: 44, iops: 8650, activeSessions: 26 },
    { day: 16, date: 'Sep 15', dbTimeSec: 1610, cpuPct: 47, iops: 9050, activeSessions: 28 },
    { day: 17, date: 'Sep 16', dbTimeSec: 1490, cpuPct: 43, iops: 8450, activeSessions: 25 },
    { day: 18, date: 'Sep 17', dbTimeSec: 1680, cpuPct: 50, iops: 9300, activeSessions: 30 },
    { day: 19, date: 'Sep 18', dbTimeSec: 1550, cpuPct: 45, iops: 8750, activeSessions: 27 },
    { day: 20, date: 'Sep 19', dbTimeSec: 1310, cpuPct: 37, iops: 7500, activeSessions: 22 },
    { day: 21, date: 'Sep 20', dbTimeSec: 1280, cpuPct: 35, iops: 7350, activeSessions: 21 },
    { day: 22, date: 'Sep 21', dbTimeSec: 1540, cpuPct: 45, iops: 8700, activeSessions: 26 },
    { day: 23, date: 'Sep 22', dbTimeSec: 1590, cpuPct: 46, iops: 8950, activeSessions: 27 },
    { day: 24, date: 'Sep 23', dbTimeSec: 1470, cpuPct: 42, iops: 8300, activeSessions: 24 },
    { day: 25, date: 'Sep 24', dbTimeSec: 1660, cpuPct: 49, iops: 9200, activeSessions: 29 },
    { day: 26, date: 'Sep 25', dbTimeSec: 1730, cpuPct: 53, iops: 9500, activeSessions: 31 },
    { day: 27, date: 'Sep 26', dbTimeSec: 1340, cpuPct: 38, iops: 7700, activeSessions: 22 },
    { day: 28, date: 'Sep 27', dbTimeSec: 1210, cpuPct: 33, iops: 7000, activeSessions: 19 },
    { day: 29, date: 'Sep 28', dbTimeSec: 1530, cpuPct: 44, iops: 8600, activeSessions: 26 },
    { day: 30, date: 'Sep 29', dbTimeSec: 1480, cpuPct: 43, iops: 8420, activeSessions: 25 },
  ];

  const maxDbTime = Math.max(...workloadHistory.map((d) => d.dbTimeSec));
  const maxIops = Math.max(...workloadHistory.map((d) => d.iops));

  // Compute top wait event
  const primaryWait = waitEvents[0] || {
    eventName: 'db file sequential read',
    waitClass: 'User I/O',
    totalWaits: 4520,
    timeWaitedSec: 1420,
    percentageDbTime: 42,
    avgWaitMs: 3.1,
    severity: 'normal' as const,
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* 1. Real-time DBA Sentinel Status Banner */}
      <div className="bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 rounded-lg p-3 sm:p-3.5 flex items-start gap-3 transition-colors shadow-2xs">
        <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-sky-950 dark:text-sky-200 leading-tight">
              Autonomous Oracle AI DBA Sentinel Active • 2-Node RAC Telemetry Live
            </h4>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
              HEALTHY
            </span>
          </div>
          <p className="text-[11px] text-sky-800/80 dark:text-sky-300/80 mt-0.5">
            Active RAC instances <span className="font-mono font-bold">rac-node-01</span> &amp; <span className="font-mono font-bold">rac-node-02</span>. Buffer cache hit ratio at <strong className="font-mono">{metrics.bufferCacheHitRatio}%</strong> with 0 deadlock cascades. AI Copilot Crew actively tuning CBO query execution plans and auditing CIS 19c benchmarks.
          </p>
        </div>
      </div>

      {/* 2. Top Header & DBA Action Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Oracle AI DBA Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time SGA/PGA telemetry, CBO optimizer performance, wait-state diagnostics &amp; autonomous CIS 19c hardening
          </p>
        </div>

        {/* Action & Filter Pills on Right */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {/* Target Instance Dropdown */}
          <div className="relative">
            <select
              value={selectedInstanceFilter}
              onChange={(e) => setSelectedInstanceFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-md py-1.5 pl-3 pr-8 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <option value="all">All RAC Nodes (Cluster-Wide)</option>
              <option value="node1">rac-node-01 (Primary CBO)</option>
              <option value="node2">rac-node-02 (Standby Batch)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Time Window Dropdown */}
          <div className="relative">
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-md py-1.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>AWR 30 Days</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>
          </div>

          {/* '+ Add' Primary Action Button */}
          <button
            onClick={() => onOpenQuickActionModal ? onOpenQuickActionModal() : onNavigateToTab('tuner')}
            className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-md py-1.5 px-3 shadow-xs transition-colors cursor-pointer"
            title="Execute DBA Action"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Action</span>
          </button>
        </div>
      </div>

      {/* 3. Main Dashboard Grid Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-200 dark:divide-slate-800">
        
        {/* ROW 1: Database Load & Sessions | Wait Events & Diagnostics | AI Optimizer & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Card 1: Database Load & Active Sessions */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Database Load &amp; Sessions
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-4">
                What the Oracle engine is consuming: CPU utilization, active concurrent sessions on CPU vs I/O wait, and buffer cache hit ratio.
              </p>

              {/* Sessions & CPU Figures */}
              <div className="space-y-3 py-1">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {metrics.activeSessions} <span className="text-xs text-slate-400 font-normal">Active Sessions</span>
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                      <TrendingDown className="w-3 h-3 mr-0.5" /> CPU: {metrics.cpuUtilization}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        metrics.cpuUtilization > 80 ? 'bg-rose-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, metrics.cpuUtilization)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>SGA Buffer Cache Hit</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.bufferCacheHitRatio}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Physical IOPS</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.iops.toLocaleString()} IOPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo Generation Rate</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.redoLogRateMBs} MB/s</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>{currentDb.name} ({currentDb.type})</span>
              <span>Cluster RAC Node 1 &amp; 2</span>
            </div>
          </div>

          {/* Card 2: Top Wait Events & Bottlenecks */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Top Wait Events &amp; Diagnostics
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-4">
                Active wait events from <code className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">v$system_event</code> and ASH, plan regressions, and storage alerts.
              </p>

              {/* 4 Columns for DBA Key Indicators */}
              <div className="grid grid-cols-4 gap-2 pt-1 pb-3 text-center sm:text-left">
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {primaryWait.avgWaitMs} <span className="text-[10px] font-normal text-slate-400">ms</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    avg wait time
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    User I/O
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {slowQueries.length}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    plan regressions
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    CBO cost &gt; 500
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    0
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    deadlocks
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    ORA-00060 clean
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                    {tablespaces.filter(t => t.pctUsed > 80).length}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    tablespace alerts
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    &gt;80% capacity
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>ASH Telemetry • v$active_session_history</span>
              <span>Scanned live</span>
            </div>
          </div>

          {/* Card 3: AI Optimizer & CBO Health */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  AI Optimizer &amp; Health Index
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-4">
                Autonomous DBA health scoring across CBO query plan stability, CIS 19c security posture, and storage redundancy. Zero to a hundred.
              </p>

              {/* 3 Pillars: CBO Plans | CIS Hardening | Storage */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">94</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      HEALTHY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mt-0.5">CBO Plans</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    48 of 52 queries running on optimal SPM baselines
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">84</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      GOOD
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mt-0.5">CIS 19c</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    12 of 14 security benchmark rules passing audit
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">96</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      OPTIMAL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mt-0.5">Storage</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    Autoextend verified across all ASM datafiles
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>Autonomous CBO Feedback Active</span>
              <span>AI Copilot Crew Sentinel</span>
            </div>
          </div>
        </div>

        {/* ROW 2: Autonomous CBO Optimization Savings | CIS Hardening Misconfigurations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Card 4: Autonomous CBO Optimization Savings */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Autonomous CBO Optimization &amp; Workload Savings
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-4">
                Verified database execution time and I/O savings realized from applying SQL plan baselines, composite indexes, and CBO profiles.
              </p>

              {/* Workload Savings Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Realized DB Time Reduction</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    -68.4% <span className="text-xs font-normal text-slate-400">Elapsed</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Verified from 14 applied SQL &amp; CBO tunings
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Open Potential Gain</span>
                  <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                    -24.2% <span className="text-xs font-normal text-slate-400">Additional</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Available if {slowQueries.length} pending candidate queries are tuned
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2">
                <span>Relieved Logical Reads: <strong className="text-slate-800 dark:text-slate-200">-78.4% Buffer Gets</strong></span>
                <button
                  onClick={() => onNavigateToTab('tuner')}
                  className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Open SQL Tuner Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>Autonomous SQL Tuning Task • DBMS_SQLTUNE</span>
              <span>All Workloads</span>
            </div>
          </div>

          {/* Card 5: CIS 19c Misconfigurations & Security Posture */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  CIS 19c Misconfigurations <span className="text-[10px] font-normal lowercase text-slate-400">counts by severity</span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-3">
                Open CIS Oracle 19c benchmark posture findings. Evaluated via OpenSCAP security scanners and dual-custody HITL remediation scripts.
              </p>

              {/* Big '14 checked' */}
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">14</span>
                <span className="text-xs text-slate-400">rules evaluated</span>
                <span className="text-xs text-rose-500 font-bold font-mono ml-auto">2 failing checks</span>
              </div>

              {/* Segmented Color Block Bars */}
              <div className="space-y-2 text-xs font-mono">
                {/* CRITICAL */}
                <div className="flex items-center justify-between gap-3">
                  <span className="w-16 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    CRITICAL
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`w-4 h-3 rounded-2xs ${i <= 1 ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">1 fail / 4</span>
                </div>

                {/* HIGH */}
                <div className="flex items-center justify-between gap-3">
                  <span className="w-16 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    HIGH
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className={`w-4 h-3 rounded-2xs ${i <= 1 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">1 fail / 6</span>
                </div>

                {/* MEDIUM */}
                <div className="flex items-center justify-between gap-3">
                  <span className="w-16 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    MEDIUM
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-4 h-3 rounded-2xs bg-emerald-500" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">0 fail / 4</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">
                  Automated rollback script generated for each rule
                </p>
                <button
                  onClick={() => onNavigateToTab('security')}
                  className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer text-xs flex items-center gap-1"
                >
                  <span>Review CIS Hardening</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>CIS Benchmark v1.1.0 • DISA STIG</span>
              <span>Dual-Custody HITL Ready</span>
            </div>
          </div>
        </div>

        {/* ROW 3: Oracle Workload & DB Time History (AWR Snapshot Series with Bar / Line toggle) */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Oracle Database Workload &amp; DB Time History <span className="text-[10px] font-normal lowercase text-slate-400">30 days • AWR Snapshot Series</span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Total DB Time (seconds) consumed by active user calls versus physical disk IOPS and CPU utilization over 30 days of AWR history.
              </p>
            </div>

            {/* Toggle: Bar | Line */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <div className="flex items-center bg-slate-900 dark:bg-slate-950 p-0.5 rounded-md text-[11px] font-semibold text-white">
                <button
                  onClick={() => setChartViewMode('bar')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    chartViewMode === 'bar' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartViewMode('line')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    chartViewMode === 'line' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Chart Canvas / SVG Container */}
          <div className="pt-4 pb-2">
            <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2 px-1 relative">
              {workloadHistory.map((d) => {
                const heightPct = Math.round((d.dbTimeSec / maxDbTime) * 88);
                const isHovered = hoveredDay === d.day;

                return (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(d.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 z-30 bg-slate-900 text-white text-[10px] font-mono px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap border border-slate-700 pointer-events-none">
                        <div className="font-bold text-sky-400">{d.date}</div>
                        <div>DB Time: <strong className="text-white">{d.dbTimeSec}s</strong></div>
                        <div>CPU: <span className="text-amber-400">{d.cpuPct}%</span></div>
                        <div>Physical IOPS: <span className="text-emerald-400">{d.iops.toLocaleString()}</span></div>
                        <div>Active Sessions: {d.activeSessions}</div>
                      </div>
                    )}

                    {/* Bar Mode or Line Dot Mode */}
                    {chartViewMode === 'bar' ? (
                      <div
                        className={`w-full rounded-t-xs transition-all ${
                          isHovered
                            ? 'bg-sky-500'
                            : 'bg-slate-300 dark:bg-slate-700 hover:bg-sky-400'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    ) : (
                      <div className="w-full flex items-center justify-center relative" style={{ height: `${heightPct}%` }}>
                        <div className={`w-2 h-2 rounded-full ${isHovered ? 'bg-sky-400 ring-4 ring-sky-400/30' : 'bg-slate-400'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-Axis Date Labels */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 px-1">
              <span>Aug 31</span>
              <span>Sep 07</span>
              <span>Sep 14</span>
              <span>Sep 21</span>
              <span>Sep 29</span>
            </div>
          </div>

          {/* Monitored Sluggish Workload Queries Table */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Top Monitored Workload Queries (v$sql)
                </h4>
              </div>
              <button
                onClick={() => onNavigateToTab('tuner')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Open SQL Tuner Studio &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">SQL ID</th>
                    <th className="py-2 px-3">Module / Schema</th>
                    <th className="py-2 px-3 text-right">Executions</th>
                    <th className="py-2 px-3 text-right">Avg Elapsed</th>
                    <th className="py-2 px-3 text-right">Buffer Gets</th>
                    <th className="py-2 px-3 text-right">CBO Cost</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {slowQueries.slice(0, 4).map((q) => (
                    <tr key={q.sqlId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">{q.sqlId}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{q.module}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{q.parsingSchema}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{q.executions.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {q.avgElapsedSec}s
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{q.bufferGets.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums">{q.currentCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          onClick={() => onSelectQueryForTuning(q)}
                          className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Tune with AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
