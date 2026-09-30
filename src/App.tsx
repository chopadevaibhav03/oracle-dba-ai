import React, { useEffect, useState } from 'react';
import { SidebarNav, NavTabId } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { SqlTunerStudio } from './components/SqlTunerStudio';
import { SessionsLocksView } from './components/SessionsLocksView';
import { TablespaceMonitor } from './components/TablespaceMonitor';
import { ApprovalAuditConsole } from './components/ApprovalAuditConsole';
import { VaptOscapSecurityView } from './components/VaptOscapSecurityView';
import { OracleDbaTerminalModal } from './components/OracleDbaTerminalModal';
import { DbaCopilotDrawer } from './components/DbaCopilotDrawer';
import { WorkloadSimulatorModal } from './components/WorkloadSimulatorModal';
import { HitlApprovalModal } from './components/HitlApprovalModal';
import { AmbientCrewBar } from './components/AmbientCrewBar';
import { LocalLlmConfigModal } from './components/LocalLlmConfigModal';
import { QuickAddModal } from './components/QuickAddModal';
import { CopilotCrewView } from './components/CopilotCrewView';
import { INITIAL_DATABASES, INITIAL_PRECOMPUTED_TUNINGS } from './data/mockOracleData';
import { api } from './services/api';
import {
  DatabaseTarget,
  HitlActionRequest,
  OracleMetric,
  OracleSession,
  OscapRule,
  SlowQuery,
  TablespaceInfo,
  TuningAuditEntry,
  TuningRecommendation,
  VaptScanSummary,
  WaitEvent,
} from './types/oracle';
import { LocalLlmConfig } from './types/llm';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('oracle_sentinel_theme') as 'dark' | 'light') || 'light';
  });

  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [databases] = useState<DatabaseTarget[]>(INITIAL_DATABASES);
  const [currentDb, setCurrentDb] = useState<DatabaseTarget>(INITIAL_DATABASES[0]);

  const [metrics, setMetrics] = useState<OracleMetric | null>(null);
  const [waitEvents, setWaitEvents] = useState<WaitEvent[]>([]);
  const [tablespaces, setTablespaces] = useState<TablespaceInfo[]>([]);
  const [sessions, setSessions] = useState<OracleSession[]>([]);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [auditLog, setAuditLog] = useState<TuningAuditEntry[]>([]);
  const [oscapRules, setOscapRules] = useState<OscapRule[]>([]);
  const [vaptSummary, setVaptSummary] = useState<VaptScanSummary | null>(null);

  const [selectedSlowQuery, setSelectedSlowQuery] = useState<SlowQuery | null>(null);
  const [tuningRecommendation, setTuningRecommendation] = useState<TuningRecommendation | null>(
    INITIAL_PRECOMPUTED_TUNINGS['8f7q2m8x9p31a'] || null
  );

  const [isTuning, setIsTuning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalInitialCommand, setTerminalInitialCommand] = useState<string>('');
  const [isScanningVapt, setIsScanningVapt] = useState(false);
  const [isRemediatingVapt, setIsRemediatingVapt] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Human-in-the-Loop State
  const [hitlRequest, setHitlRequest] = useState<HitlActionRequest | null>(null);
  const [isHitlModalOpen, setIsHitlModalOpen] = useState(false);
  const [activeOperator, setActiveOperator] = useState('CHOPADE_V (Principal DBA)');

  // Lead Model & Local LLM Configuration State
  const [localLlmConfig, setLocalLlmConfig] = useState<LocalLlmConfig>({
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    modelName: 'llama3.2:latest',
    isLead: true,
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.9,
    systemInstruction: 'You are the Lead Oracle DBA Agent powered by LangChain and RAG knowledge retrieval.',
    isConnected: true,
    latencyMs: 24,
  });
  const [isLocalLlmModalOpen, setIsLocalLlmModalOpen] = useState(false);

  // Left Sidebar Panel Open/Close state (persisted)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('oracle_sentinel_sidebar_open') !== 'false';
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('oracle_sentinel_sidebar_open', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('oracle_sentinel_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial load
  const loadAllData = async () => {
    try {
      const [mRes, wRes, tRes, sRes, sqRes, aRes, vRes, llmRes] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getWaitEvents().catch(() => ({ waitEvents: [] })),
        api.getTablespaces().catch(() => ({ tablespaces: [] })),
        api.getSessions().catch(() => ({ sessions: [] })),
        api.getSlowQueries().catch(() => ({ slowQueries: [] })),
        api.getAuditLog().catch(() => ({ auditLog: [] })),
        api.getVaptOscap().catch(() => ({ rules: [], summary: null })),
        api.getLocalLlmConfig().catch(() => null),
      ]);

      if (mRes) setMetrics(mRes.metrics);
      if (wRes?.waitEvents) setWaitEvents(wRes.waitEvents);
      if (tRes?.tablespaces) setTablespaces(tRes.tablespaces);
      if (sRes?.sessions) setSessions(sRes.sessions);
      if (sqRes?.slowQueries) {
        setSlowQueries(sqRes.slowQueries);
        if (!selectedSlowQuery) {
          setSelectedSlowQuery(sqRes.slowQueries[0] || null);
        }
      }
      if (aRes?.auditLog) setAuditLog(aRes.auditLog);
      if (vRes?.rules) {
        setOscapRules(vRes.rules);
        setVaptSummary(vRes.summary);
      }
      if (llmRes?.config) {
        setLocalLlmConfig(llmRes.config);
      }
    } catch (err) {
      console.error('Error fetching Oracle telemetry:', err);
    }
  };

  const handleSaveLocalLlmConfig = async (newConfig: Partial<LocalLlmConfig>) => {
    try {
      const res = await api.updateLocalLlmConfig(newConfig);
      if (res.config) setLocalLlmConfig(res.config);
      showToast(`Lead Model updated: ${newConfig.modelName || localLlmConfig.modelName} (${(newConfig.provider || localLlmConfig.provider).toUpperCase()})`);
    } catch (err: any) {
      setLocalLlmConfig((prev) => ({ ...prev, ...newConfig }));
      showToast(`Lead Model updated locally: ${newConfig.modelName || localLlmConfig.modelName}`);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentDb]);

  // Periodic metrics refresh when auto-refresh is active
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(async () => {
      try {
        const mRes = await api.getMetrics();
        setMetrics(mRes.metrics);
      } catch (err) {
        // silent fail on jitter
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenTerminal = (cmd: string = '') => {
    setTerminalInitialCommand(cmd);
    setIsTerminalOpen(true);
  };

  // Human-in-the-Loop Triggers
  const handleRequestHitlApproval = (request: HitlActionRequest) => {
    setHitlRequest(request);
    setIsHitlModalOpen(true);
  };

  const handleApproveHitl = async (data: {
    operator: string;
    cabTicket: string;
    mfaCode: string;
    justification: string;
  }) => {
    if (!hitlRequest) return;
    const req = hitlRequest;
    setActiveOperator(data.operator);

    try {
      if (req.actionType === 'KILL_SESSION') {
        const { sid, serial } = req.payload;
        await handleKillSession(sid, serial);
        showToast(`Signed-off & Killed Blocker SID: ${sid} by ${data.operator}`);
      } else if (req.actionType === 'APPLY_TUNING') {
        const { recommendationId, sqlId } = req.payload;
        await handleApplyTuning(recommendationId, sqlId);
        showToast(`Signed-off & Applied Plan Baseline for SQL_ID: ${sqlId}`);
      } else if (req.actionType === 'OSCAP_REMEDIATE') {
        const { ruleId } = req.payload;
        await handleRemediateRule(ruleId);
        showToast(`Signed-off & Applied Hardening for rule: ${ruleId}`);
      } else if (req.actionType === 'BATCH_REMEDIATE') {
        await handleBatchRemediateAll();
        showToast(`Signed-off & Applied Batch Hardening across all failing rules!`);
      }
    } finally {
      setIsHitlModalOpen(false);
      setHitlRequest(null);
    }
  };

  const handleRejectHitl = (reason: string) => {
    showToast(`Action rejected by operator: ${reason}`);
    setIsHitlModalOpen(false);
    setHitlRequest(null);
  };

  const handleSelectQueryForTuning = (q: SlowQuery) => {
    setSelectedSlowQuery(q);
    setActiveTab('tuner');
  };

  const handleTuneSql = async (sql: string, sqlId?: string, schema: string = 'FIN_CORE') => {
    setIsTuning(true);
    try {
      const res = await api.tuneSql({
        sqlQuery: sql,
        sqlId: sqlId || selectedSlowQuery?.sqlId || 'manual_sql',
        parsingSchema: schema,
      });

      if (res.recommendation) {
        setTuningRecommendation(res.recommendation);
        showToast(`Optimization Plan generated for SQL: ${res.recommendation.sqlId}!`);
      }
    } catch (err: any) {
      console.error('Tuning error:', err);
      showToast(`Error tuning SQL: ${err.message || 'Optimizer busy'}`);
    } finally {
      setIsTuning(false);
    }
  };

  const handleApplyTuning = async (recId: string, sqlId: string) => {
    setIsApplying(true);
    try {
      const res = await api.applyTuning({
        recommendationId: recId,
        sqlId,
        executedBy: activeOperator,
      });
      if (res.success) {
        setTuningRecommendation((prev) =>
          prev && prev.id === recId ? { ...prev, approvalStatus: 'APPLIED' } : prev
        );
        setSlowQueries((prev) =>
          prev.map((q) => (q.sqlId === sqlId ? { ...q, status: 'APPLIED' } : q))
        );
        showToast(`Plan Baseline & Online DDL applied successfully to ${currentDb.name}!`);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Apply tuning error:', err);
      showToast(`Failed to apply tuning: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleKillSession = async (sid: number, serial: number) => {
    try {
      const res = await api.killSession(sid, serial);
      if (res.success) {
        showToast(`Session ${sid} successfully killed with IMMEDIATE option.`);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Kill session error:', err);
      showToast(`Failed to kill session: ${err.message}`);
    }
  };

  const handleRunVaptScan = async () => {
    setIsScanningVapt(true);
    try {
      const res = await api.runVaptScan();
      if (res.rules) {
        setOscapRules(res.rules);
        setVaptSummary(res.summary);
        showToast(`VAPT Scan complete: ${res.summary.failed} rules failed out of ${res.rules.length}`);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      showToast(`Scan error: ${err.message}`);
    } finally {
      setIsScanningVapt(false);
    }
  };

  const handleRemediateRule = async (ruleId: string) => {
    setIsRemediatingVapt(true);
    try {
      const res = await api.remediateVaptRule({
        ruleId,
        executedBy: activeOperator,
      });
      if (res.rules) {
        setOscapRules(res.rules);
        showToast(`Remediated security rule: ${ruleId}`);
        const vRes = await api.getVaptOscap();
        if (vRes?.summary) setVaptSummary(vRes.summary);
        const aRes = await api.getAuditLog();
        if (aRes?.auditLog) setAuditLog(aRes.auditLog);
      }
    } catch (err: any) {
      console.error('Remediation error:', err);
      showToast(`Remediation failed: ${err.message}`);
    } finally {
      setIsRemediatingVapt(false);
    }
  };

  const handleBatchRemediateAll = async () => {
    setIsRemediatingVapt(true);
    try {
      const res = await api.remediateVaptRule({
        batchAllFailed: true,
        executedBy: activeOperator,
      });
      if (res.remediatedCount) {
        showToast(`Successfully remediated ${res.remediatedCount} CIS 19c rules!`);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Batch error:', err);
      showToast(`Batch remediation failed: ${err.message}`);
    } finally {
      setIsRemediatingVapt(false);
    }
  };

  const vaptFailedCount = oscapRules.filter((r) => r.status === 'FAIL').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-sky-500/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Left Navigation Sidebar matching reference design */}
      <SidebarNav
        isOpen={isSidebarOpen}
        onToggleOpen={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        databases={databases}
        currentDb={currentDb}
        setCurrentDb={setCurrentDb}
        vaptFailedCount={vaptFailedCount}
        onOpenTerminal={() => handleOpenTerminal('')}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        leadLlmConfig={localLlmConfig}
        onOpenLocalLlmModal={() => setIsLocalLlmModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeOperator={activeOperator}
        isAutoRefresh={isAutoRefresh}
        setIsAutoRefresh={setIsAutoRefresh}
        onRefresh={loadAllData}
      />

      {/* Main Content Area Container on the Right */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <TopHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          activeTab={activeTab}
          currentDb={currentDb}
          metrics={metrics}
          onOpenTerminal={() => handleOpenTerminal('')}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          leadLlmConfig={localLlmConfig}
          onOpenLocalLlmModal={() => setIsLocalLlmModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          activeOperator={activeOperator}
          isAutoRefresh={isAutoRefresh}
          setIsAutoRefresh={setIsAutoRefresh}
          onRefresh={loadAllData}
        />

        {/* Main View Container */}
        <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {(activeTab === 'dashboard' || activeTab === 'spend') && (
            <DashboardView
              metrics={metrics}
              waitEvents={waitEvents}
              slowQueries={slowQueries}
              tablespaces={tablespaces}
              currentDb={currentDb}
              onSelectQueryForTuning={handleSelectQueryForTuning}
              onNavigateToTab={setActiveTab}
              onOpenQuickActionModal={() => setIsQuickAddOpen(true)}
            />
          )}

          {(activeTab === 'tuner' || activeTab === 'cost_opt') && (
            <SqlTunerStudio
              slowQueries={slowQueries}
              selectedSlowQuery={selectedSlowQuery}
              setSelectedSlowQuery={setSelectedSlowQuery}
              tuningRecommendation={tuningRecommendation}
              isTuning={isTuning}
              onTuneSql={handleTuneSql}
              onApplyTuning={handleApplyTuning}
              isApplying={isApplying}
            />
          )}

          {activeTab === 'security' && (
            <VaptOscapSecurityView
              rules={oscapRules}
              summary={vaptSummary}
              currentDb={currentDb}
              onRunScan={handleRunVaptScan}
              onRemediateRule={handleRemediateRule}
              onBatchRemediateAll={handleBatchRemediateAll}
              onOpenTerminalWithCommand={handleOpenTerminal}
              onRequestHitlApproval={handleRequestHitlApproval}
              isScanning={isScanningVapt}
              isRemediating={isRemediatingVapt}
              onToast={showToast}
            />
          )}

          {activeTab === 'resources' && (
            <SessionsLocksView
              sessions={sessions}
              onKillSession={handleKillSession}
              onRefresh={loadAllData}
              onRequestHitlApproval={handleRequestHitlApproval}
              onSelectSqlIdForTuning={(sqlId) => {
                const q = slowQueries.find((sq) => sq.sqlId === sqlId);
                if (q) {
                  handleSelectQueryForTuning(q);
                } else {
                  setActiveTab('tuner');
                }
              }}
            />
          )}

          {activeTab === 'cloud_accounts' && (
            <TablespaceMonitor tablespaces={tablespaces} onRefresh={loadAllData} />
          )}

          {(activeTab === 'reports' || activeTab === 'budgets' || activeTab === 'team') && (
            <ApprovalAuditConsole
              auditLog={auditLog}
              tuningRecommendation={tuningRecommendation}
              onApplyPendingTuning={handleApplyTuning}
              isApplying={isApplying}
              currentDb={currentDb}
              onToast={showToast}
              onRequestHitlApproval={handleRequestHitlApproval}
            />
          )}

          {(activeTab === 'support' || activeTab === 'settings') && (
            <CopilotCrewView
              currentDb={currentDb}
              metrics={metrics}
              leadLlmConfig={localLlmConfig}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onOpenLocalLlmModal={() => setIsLocalLlmModalOpen(true)}
              onOpenTerminal={handleOpenTerminal}
            />
          )}
        </main>

        {/* Enterprise Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 py-3.5 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div className="max-w-[1520px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Oracle Autonomous AI DBA Sentinel • Dual-Custody HITL Architecture</span>
            </div>
            <span>CIS 19c Benchmark • AWR CBO Optimizer • ISO-27001 &amp; SOX-404 Compliance</span>
          </div>
        </footer>
      </div>

      {/* Quick Add Action Modal triggered from '+ Add' button */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAction={(actionId) => {
          if (actionId === 'tune_sql') setActiveTab('tuner');
          else if (actionId === 'simulate_workload') setIsSimulatorOpen(true);
          else if (actionId === 'run_vapt') {
            setActiveTab('security');
            handleRunVaptScan();
          } else if (actionId === 'expand_storage') setActiveTab('cloud_accounts');
          else if (actionId === 'open_terminal') handleOpenTerminal('');
          else if (actionId === 'generate_pdf') setActiveTab('reports');
        }}
      />

      {/* Ambient Copilot Crew Bar (Bottom-Left) */}
      <AmbientCrewBar
        activeTab={activeTab}
        metrics={metrics}
        currentDb={currentDb}
        vaptFailedCount={vaptFailedCount}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenTerminal={handleOpenTerminal}
        onRequestHitlApproval={handleRequestHitlApproval}
        leadLlmConfig={localLlmConfig}
        onOpenLocalLlmModal={() => setIsLocalLlmModalOpen(true)}
      />

      {/* Interactive DBA Terminal Modal */}
      <OracleDbaTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        currentDb={currentDb}
        initialCommand={terminalInitialCommand}
        onToast={showToast}
      />

      {/* Workload Stress Simulator Modal */}
      <WorkloadSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={async (scenario) => {
          await api.simulateWorkload(scenario);
          showToast(`Injected workload scenario: ${scenario}`);
          await loadAllData();
        }}
        isSimulating={false}
      />

      {/* AI DBA Copilot Drawer */}
      <DbaCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onRequestHitlApproval={handleRequestHitlApproval}
        onRunVaptScan={handleRunVaptScan}
        onExecuteTerminalCommand={handleOpenTerminal}
        onToast={showToast}
        leadLlmConfig={localLlmConfig}
        onOpenLocalLlmModal={() => setIsLocalLlmModalOpen(true)}
      />

      {/* Human-In-The-Loop Approval Modal */}
      <HitlApprovalModal
        isOpen={isHitlModalOpen}
        request={hitlRequest}
        onClose={() => {
          setIsHitlModalOpen(false);
          setHitlRequest(null);
        }}
        onApprove={handleApproveHitl}
        onReject={handleRejectHitl}
      />

      {/* Lead Local LLM Configuration Modal */}
      <LocalLlmConfigModal
        isOpen={isLocalLlmModalOpen}
        onClose={() => setIsLocalLlmModalOpen(false)}
        config={localLlmConfig}
        onSaveConfig={handleSaveLocalLlmConfig}
        onToast={showToast}
      />
    </div>
  );
}
