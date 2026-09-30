import React, { useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  HardDrive,
  Layers,
  MessageSquare,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { LocalLlmConfig } from '../types/llm';
import { DatabaseTarget, OracleMetric } from '../types/oracle';
import { INITIAL_RAG_KNOWLEDGE_BASE } from '../data/mockRagKnowledge';

interface Props {
  currentDb: DatabaseTarget;
  metrics: OracleMetric | null;
  leadLlmConfig: LocalLlmConfig;
  onOpenCopilot: () => void;
  onOpenLocalLlmModal: () => void;
  onOpenTerminal: (cmd?: string) => void;
}

export const CopilotCrewView: React.FC<Props> = ({
  currentDb,
  metrics,
  leadLlmConfig,
  onOpenCopilot,
  onOpenLocalLlmModal,
  onOpenTerminal,
}) => {
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [selectedAgentTab, setSelectedAgentTab] = useState<'all' | 'tuning' | 'security' | 'storage' | 'sre'>('all');

  const agents = [
    {
      id: 'archibald',
      name: 'Archibald',
      role: 'Lead CBO Tuning Specialist',
      avatar: '🧠',
      status: 'ACTIVE_SUPERVISOR',
      specialty: 'SQL Plan Baselines, CBO Cardinality Feedback & Index Optimization',
      tools: ['cbo_explain_plan', 'create_sql_plan_baseline', 'sql_tune_task'],
      category: 'tuning',
      lastAction: 'Analyzed SQL_ID 8f7q2m8x9p31a and generated Composite B-Tree index recommendation.',
    },
    {
      id: 'seraphina',
      name: 'Seraphina',
      role: 'Autonomous Security Sentinel',
      avatar: '🛡️',
      status: 'SCANNING_CIS',
      specialty: 'CIS Oracle 19c Benchmark, OpenSCAP Profiles & Dual-Custody Hardening',
      tools: ['vapt_oscap_scan', 'remediate_cis_rule', 'generate_rollback_script'],
      category: 'security',
      lastAction: 'Audited SPFILE parameters; flagged REMOTE_OS_AUTHENT for immediate sign-off.',
    },
    {
      id: 'valerius',
      name: 'Valerius',
      role: 'Storage & Capacity Architect',
      avatar: '💾',
      status: 'MONITORING_ASM',
      specialty: 'ASM Diskgroups, High-Water Mark Reclaim & Proactive Datafile Autoextend',
      tools: ['inspect_dba_data_files', 'resize_tablespace', 'predict_exhaustion'],
      category: 'storage',
      lastAction: 'Forecasted USERS_DATA tablespace capacity at 88.5%; suggested 10GB autoextend.',
    },
    {
      id: 'helena',
      name: 'Helena',
      role: 'RAC SRE & Lock Triage Specialist',
      avatar: '⚡',
      status: 'INTERCEPTING_LOCKS',
      specialty: 'v$lock Blocking Tree, ORA-00060 Deadlock Prevention & Session Eviction',
      tools: ['query_blocking_tree', 'kill_session_hitl', 'trace_session_ash'],
      category: 'sre',
      lastAction: 'Detected exclusive row lock on ORDERS table by SID 142 stalling downstream sessions.',
    },
  ];

  const filteredAgents = selectedAgentTab === 'all'
    ? agents
    : agents.filter(a => a.category === selectedAgentTab);

  const filteredDocs = INITIAL_RAG_KNOWLEDGE_BASE.filter(doc =>
    doc.docTitle.toLowerCase().includes(ragSearchQuery.toLowerCase()) ||
    doc.section.toLowerCase().includes(ragSearchQuery.toLowerCase()) ||
    doc.tags.some(t => t.toLowerCase().includes(ragSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Autonomous Oracle AI DBA Copilot Crew
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Multi-agent architecture orchestrating LangChain tool execution, Oracle 19c RAG knowledge retrieval, and dual-custody HITL verification for mission-critical enterprise databases.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={onOpenLocalLlmModal}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-sky-500" />
            <span>Lead Model: {leadLlmConfig.modelName}</span>
          </button>

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Launch Copilot Chat</span>
          </button>
        </div>
      </div>

      {/* Agents Roster Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Copilot Agents ({agents.length})
          </h2>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
            {(['all', 'tuning', 'security', 'storage', 'sre'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedAgentTab(tab)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                  selectedAgentTab === tab
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-sky-500/50 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1 bg-slate-50 dark:bg-slate-800 rounded-lg">{agent.avatar}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {agent.name}
                      </h3>
                      <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1 animate-pulse" />
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {agent.specialty}
                </p>

                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    LangChain Tools
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.map(tool => (
                      <span
                        key={tool}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Last Observation</div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-snug">
                  "{agent.lastAction}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAG Knowledge Base Search & Index Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Oracle 19c &amp; CIS Hardening RAG Knowledge Base
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vectorized Oracle documentation, Metalink incident runbooks, and CIS security benchmarks available to LangChain agents.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ragSearchQuery}
              onChange={(e) => setRagSearchQuery(e.target.value)}
              placeholder="Search RAG knowledge chunks..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg py-1.5 pl-8 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredDocs.slice(0, 6).map(doc => (
            <div
              key={doc.id}
              className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {doc.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Score: 0.96
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                {doc.docTitle} - {doc.section}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {doc.content}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {doc.tags.map(t => (
                  <span
                    key={t}
                    className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
