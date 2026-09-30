import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  Database,
  FileText,
  Layers,
  Play,
  Radio,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { CopilotCrewMember, CopilotToolCall, HitlActionRequest } from '../types/oracle';
import { AgentExecutionTrace, LocalLlmConfig, RagDocumentChunk } from '../types/llm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  agentRole?: string;
  toolCall?: CopilotToolCall;
  ragChunks?: RagDocumentChunk[];
  agentTrace?: AgentExecutionTrace;
  leadModel?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestHitlApproval?: (request: HitlActionRequest) => void;
  onRunVaptScan?: () => Promise<void>;
  onExecuteTerminalCommand?: (cmd: string) => void;
  onToast?: (message: string) => void;
  leadLlmConfig?: LocalLlmConfig;
  onOpenLocalLlmModal?: () => void;
}

const CREW_MEMBERS: CopilotCrewMember[] = [
  {
    id: 'archibald',
    name: 'Archibald',
    role: 'AWR & CBO Tuning Specialist',
    avatar: '🧠',
    specialty: 'Execution plans, Wait events, SQL Profile baselines',
    status: 'ACTIVE',
  },
  {
    id: 'seraphina',
    name: 'Seraphina',
    role: 'OpenSCAP & VAPT Security Sentinel',
    avatar: '🛡️',
    specialty: 'CIS 19c benchmarks, STIG hardening, Credential hygiene',
    status: 'ACTIVE',
  },
  {
    id: 'theron',
    name: 'Theron',
    role: 'ASM & Storage Capacity Optimizer',
    avatar: '💾',
    specialty: 'Tablespace fragmentation, Datafile autoextend, Redo logs',
    status: 'IDLE',
  },
];

export const DbaCopilotDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onRequestHitlApproval,
  onRunVaptScan,
  onExecuteTerminalCommand,
  onToast,
  leadLlmConfig,
  onOpenLocalLlmModal,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<CopilotCrewMember>(CREW_MEMBERS[0]);
  const [activeTraceModal, setActiveTraceModal] = useState<AgentExecutionTrace | null>(null);
  const [expandedRagMsgId, setExpandedRagMsgId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      agentName: 'Archibald',
      agentRole: 'AWR & CBO Tuning Specialist',
      leadModel: leadLlmConfig?.modelName || 'llama3.2:latest',
      content: `Hello DBA! I am **Archibald**, leading your **Oracle AI DBA Sentinel Copilot Crew** alongside **Seraphina (Security Sentinel)** and **Theron (Storage Optimizer)**.

We continuously monitor **PROD_RAC01 (PDB_FIN_CORE)** using **LangChain tool calling** and verified **Oracle 19c RAG knowledge**:
- ⚡ **AWR Triage:** Detect locks (\`enq: TX\`), slow queries, and generate SPM baselines.
- 🛡️ **VAPT / OSCAP:** Audit CIS Oracle 19c benchmarks and automate zero-downtime remediations.
- 🔐 **Dual-Custody HITL:** Every critical action requires human approval with step-up MFA.
- 🧠 **Lead Engine:** Local LLM with LangChain multi-step agent reasoning and vector grounding.

How can our crew assist your database operations right now?`,
      ragChunks: [
        {
          id: 'rag-cbo-01',
          docTitle: 'Oracle Database 19c Performance Tuning Guide',
          category: 'CBO_TUNING',
          section: 'Chapter 14: Optimizer Cost Calculation & Function-Based Indexes',
          content: 'When WHERE predicates apply functions (UPPER(country)), standard B-Tree indexes are ignored, causing 12M-row Full Table Scans. Solution: Online Function-Based Index.',
          tags: ['cbo', 'tuning'],
          keywords: ['cbo', 'tuning'],
          relevanceScore: 0.98,
        },
      ],
      agentTrace: {
        id: 'trace-init-1',
        query: 'Initialize Oracle DBA Sentinel Copilot Crew and audit PROD_RAC01',
        leadModel: leadLlmConfig?.modelName || 'llama3.2:latest',
        provider: leadLlmConfig?.provider || 'ollama',
        framework: 'LangChain Agent',
        totalDurationMs: 145,
        ragChunksUsed: 1,
        steps: [
          {
            stepNumber: 1,
            type: 'THOUGHT',
            title: 'Telemetry Assessment',
            description: 'Lead model assessed PROD_RAC01 health status. CPU 78%, 2 blocked sessions identified on FIN_CORE.',
            timestamp: new Date().toISOString(),
            durationMs: 35,
          },
          {
            stepNumber: 2,
            type: 'RAG_RETRIEVAL',
            title: 'Knowledge Base Retrieval',
            description: 'Retrieved Oracle 19c Performance Tuning Guide (Chapter 14: Optimizer Cost Calculation). Similarity score: 98%.',
            timestamp: new Date().toISOString(),
            durationMs: 65,
          },
          {
            stepNumber: 3,
            type: 'FINAL_SYNTHESIS',
            title: 'Crew Readiness Briefing',
            description: 'Archibald, Seraphina, and Theron armed with diagnostic playbooks and HITL dual-custody gates.',
            timestamp: new Date().toISOString(),
            durationMs: 45,
          },
        ],
      },
    },
    {
      id: 'msg-init-2',
      role: 'assistant',
      agentName: 'Seraphina',
      agentRole: 'OpenSCAP & VAPT Security Sentinel',
      leadModel: leadLlmConfig?.modelName || 'llama3.2:latest',
      content: `⚠️ **Proactive Alert from Seraphina:** OpenSCAP scan detected **6 open vulnerabilities** on \`PROD_RAC01\`. Most critical: \`REMOTE_OS_AUTHENT=TRUE\` and unlocked sample accounts. Click below to launch remediation with human authorization.`,
      toolCall: {
        id: 'tool-call-1',
        toolName: 'remediate_security_rule',
        args: { ruleCode: 'CIS-ORA19-1.1', parameter: 'REMOTE_OS_AUTHENT', targetValue: 'FALSE' },
        isCritical: true,
        status: 'PENDING_APPROVAL',
      },
      ragChunks: [
        {
          id: 'rag-cis-04',
          docTitle: 'CIS Oracle Database 19c Benchmark v1.1.0',
          category: 'SECURITY_CIS',
          section: '1.1: Ensure REMOTE_OS_AUTHENT is set to FALSE',
          content: 'REMOTE_OS_AUTHENT=TRUE permits remote client spoofing of SYS/SYSTEM without password challenge. Remediate in SPFILE.',
          tags: ['cis', 'stig', 'spfile'],
          keywords: ['remote_os_authent'],
          relevanceScore: 0.99,
        },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetChips = [
    { label: 'Kill Blocker SID 142', prompt: 'Kill the blocking session SID 142 causing TX lock contention' },
    { label: 'Remediate REMOTE_OS_AUTHENT', prompt: 'Remediate critical security rule CIS-ORA19-1.1' },
    { label: 'Audit CIS Compliance', prompt: 'Run automated OpenSCAP and VAPT security audit' },
    { label: 'Explain Slow SQL 8f7q2m8x9p31a', prompt: 'Explain execution plan for slow query 8f7q2m8x9p31a' },
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check for specific tool calling intent
      const lower = text.toLowerCase();
      let proposedTool: CopilotToolCall | undefined = undefined;
      let assistantName = selectedAgent.name;
      let assistantRole = selectedAgent.role;

      if (lower.includes('kill') && (lower.includes('session') || lower.includes('142') || lower.includes('block'))) {
        proposedTool = {
          id: `tool-${Date.now()}`,
          toolName: 'kill_blocking_session',
          args: { sid: 142, serial: 39812, username: 'FIN_APP_USER' },
          isCritical: true,
          status: 'PENDING_APPROVAL',
        };
        assistantName = 'Archibald';
        assistantRole = 'AWR & CBO Tuning Specialist';
      } else if (lower.includes('remediate') || lower.includes('remote_os_authent') || lower.includes('cis-ora19-1.1')) {
        proposedTool = {
          id: `tool-${Date.now()}`,
          toolName: 'remediate_security_rule',
          args: { ruleCode: 'CIS-ORA19-1.1', title: 'Disable REMOTE_OS_AUTHENT', targetValue: 'FALSE' },
          isCritical: true,
          status: 'PENDING_APPROVAL',
        };
        assistantName = 'Seraphina';
        assistantRole = 'OpenSCAP & VAPT Security Sentinel';
      } else if (lower.includes('audit') || lower.includes('vapt') || lower.includes('scan')) {
        proposedTool = {
          id: `tool-${Date.now()}`,
          toolName: 'run_vapt_scan',
          args: { profile: 'CIS Oracle 19c Benchmark v1.1.0' },
          isCritical: false,
          status: 'PROPOSED',
        };
        assistantName = 'Seraphina';
      } else if (lower.includes('tune') || lower.includes('plan') || lower.includes('index')) {
        proposedTool = {
          id: `tool-${Date.now()}`,
          toolName: 'apply_sql_tuning',
          args: { sqlId: '8f7q2m8x9p31a', recommendationId: 'rec-init-001', expectedGainPct: 84.6 },
          isCritical: true,
          status: 'PENDING_APPROVAL',
        };
        assistantName = 'Archibald';
      }

      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));

      const { reply, ragChunks, agentTrace, leadModel } = await api.chat(text, history);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          agentName: assistantName,
          agentRole: assistantRole,
          content: reply,
          toolCall: proposedTool,
          ragChunks,
          agentTrace,
          leadModel: leadModel || leadLlmConfig?.modelName,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `⚠️ Error contacting Oracle DBA Sentinel service: ${err.message || 'Please retry.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteToolCall = (tool: CopilotToolCall, msgId: string) => {
    if (tool.isCritical && onRequestHitlApproval) {
      // Trigger formal HITL modal
      if (tool.toolName === 'kill_blocking_session') {
        onRequestHitlApproval({
          id: `hitl-${Date.now()}`,
          title: `Terminate Blocker Session SID ${tool.args.sid},${tool.args.serial}`,
          actionType: 'KILL_SESSION',
          riskLevel: 'HIGH',
          blastRadius: 'Releases exclusive row locks; active client process will receive ORA-00028.',
          database: 'PROD_RAC01 (PDB_FIN_CORE)',
          commands: [`ALTER SYSTEM KILL SESSION '${tool.args.sid},${tool.args.serial}' IMMEDIATE;`],
          rollbackCommand: '-- Session termination cannot be rolled back',
          initiator: 'AI Copilot Crew (Archibald)',
          payload: { sid: tool.args.sid, serial: tool.args.serial },
        });
      } else if (tool.toolName === 'remediate_security_rule') {
        onRequestHitlApproval({
          id: `hitl-${Date.now()}`,
          title: `Apply CIS Benchmark Hardening: ${tool.args.ruleCode}`,
          actionType: 'OSCAP_REMEDIATE',
          riskLevel: 'CRITICAL',
          blastRadius: 'Alters database SPFILE parameters. Disables unauthenticated remote OS authentication.',
          database: 'PROD_RAC01 (PDB_FIN_CORE)',
          commands: [`ALTER SYSTEM SET REMOTE_OS_AUTHENT=FALSE SCOPE=SPFILE;`],
          rollbackCommand: `ALTER SYSTEM SET REMOTE_OS_AUTHENT=TRUE SCOPE=SPFILE;`,
          initiator: 'AI Copilot Crew (Seraphina)',
          payload: { ruleId: 'rule-cis-1-1' },
        });
      } else if (tool.toolName === 'apply_sql_tuning') {
        onRequestHitlApproval({
          id: `hitl-${Date.now()}`,
          title: `Apply SQL Tuning Plan & Online Index for SQL ${tool.args.sqlId}`,
          actionType: 'APPLY_TUNING',
          riskLevel: 'MEDIUM',
          blastRadius: 'Online non-blocking index creation on CUSTOMERS table; creates SQL Plan Baseline.',
          database: 'PROD_RAC01 (PDB_FIN_CORE)',
          commands: [
            `CREATE INDEX FIN_CORE.IDX_CUST_COUNTRY_UPPER ON FIN_CORE.CUSTOMERS (UPPER(country)) TABLESPACE INDX_TBS01 ONLINE;`,
            `DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(sql_id => '${tool.args.sqlId}');`,
          ],
          rollbackCommand: `DROP INDEX FIN_CORE.IDX_CUST_COUNTRY_UPPER;`,
          initiator: 'AI Copilot Crew (Archibald)',
          payload: { recommendationId: tool.args.recommendationId, sqlId: tool.args.sqlId },
        });
      }
    } else if (tool.toolName === 'run_vapt_scan' && onRunVaptScan) {
      onRunVaptScan();
      // Mark executed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.toolCall
            ? { ...m, toolCall: { ...m.toolCall, status: 'EXECUTED', result: 'Scan completed successfully.' } }
            : m
        )
      );
    }
  };

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 transition-colors">
        
        {/* Header with Crew Switcher */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">AI DBA Copilot Crew</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Crew Online: 3 Agents
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Context: PROD_RAC01 (PDB_FIN_CORE) • 19c Enterprise</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crew Member Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Crew:
          </span>
          {CREW_MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedAgent(member)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedAgent.id === member.id
                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{member.avatar}</span>
              <span>{member.name}</span>
            </button>
          ))}
        </div>

        {/* Lead Model Engine Status & Configuration */}
        <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-800/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              Lead Model: <strong className="text-white font-mono">{leadLlmConfig?.modelName || 'llama3.2:latest'}</strong> ({leadLlmConfig?.provider?.toUpperCase() || 'OLLAMA'})
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700">
              LangChain &amp; RAG
            </span>
          </div>

          {onOpenLocalLlmModal && (
            <button
              onClick={onOpenLocalLlmModal}
              className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Configure Engine
            </button>
          )}
        </div>

        {/* Preset Chips */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-2">
          {presetChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSend(chip.prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-cyan-500" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 shadow-sm relative group space-y-2.5 ${
                  m.role === 'user'
                    ? 'bg-cyan-600 text-white font-medium'
                    : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {/* Agent Header Tag */}
                {m.role === 'assistant' && m.agentName && (
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{m.agentName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 dark:text-slate-400">{m.agentRole}</span>
                    </div>

                    <button
                      onClick={() => copyMessage(m.content, m.id)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy message"
                    >
                      {copiedIndex === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                  {m.content}
                </div>

                {/* RAG Knowledge Grounding & LangChain Trace Actions */}
                {m.role === 'assistant' && (m.ragChunks?.length || m.agentTrace) && (
                  <div className="pt-1 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/80">
                    {m.ragChunks && m.ragChunks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedRagMsgId(expandedRagMsgId === m.id ? null : m.id)}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 py-0.5 px-2 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3 text-cyan-500" />
                        <span>
                          RAG Grounding ({m.ragChunks.length} Oracle 19c Docs)
                        </span>
                        {expandedRagMsgId === m.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {m.agentTrace && (
                      <button
                        type="button"
                        onClick={() => setActiveTraceModal(m.agentTrace || null)}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 py-0.5 px-2 rounded-md bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800 transition-colors cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-cyan-500" />
                        <span>LangChain Agent Trace ({m.agentTrace.steps.length} Steps • {m.agentTrace.totalDurationMs}ms)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Expanded RAG Document Chunks */}
                {expandedRagMsgId === m.id && m.ragChunks && m.ragChunks.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px] animate-in fade-in duration-150">
                    <span className="font-bold text-slate-900 dark:text-white block text-[10px] uppercase tracking-wider text-slate-500">
                      Retrieved Knowledge Chunks (Vector Cosine Match):
                    </span>
                    {m.ragChunks.map((chunk, idx) => (
                      <div key={idx} className="p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-cyan-700 dark:text-cyan-300 truncate">
                            {chunk.docTitle}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                            {Math.round((chunk.relevanceScore || 0.95) * 100)}% Match
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {chunk.section}
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                          "{chunk.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Structured Specific Tool Call Card */}
                {m.toolCall && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                          {m.toolCall.toolName}()
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          m.toolCall.status === 'EXECUTED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : m.toolCall.isCritical
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse'
                            : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                        }`}
                      >
                        {m.toolCall.status === 'EXECUTED' ? 'Executed' : m.toolCall.isCritical ? 'HITL Required' : 'Proposed'}
                      </span>
                    </div>

                    <pre className="p-2 rounded bg-slate-900 text-cyan-300 font-mono text-[10px] overflow-x-auto">
                      {JSON.stringify(m.toolCall.args, null, 2)}
                    </pre>

                    {m.toolCall.status !== 'EXECUTED' && (
                      <div className="pt-1">
                        <button
                          onClick={() => handleExecuteToolCall(m.toolCall!, m.id)}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            m.toolCall.isCritical
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-950/40'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {m.toolCall.isCritical
                              ? 'Authorize via Dual-Custody HITL'
                              : 'Execute Tool in Environment'}
                          </span>
                        </button>
                      </div>
                    )}

                    {m.toolCall.status === 'EXECUTED' && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Action successfully authorized &amp; executed.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-2 text-slate-500 dark:text-slate-400 shadow-sm">
                <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span>Crew is analyzing telemetry &amp; CBO execution state...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${selectedAgent.name} (e.g. diagnose ORA-01555, kill blocker, audit CIS)...`}
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* LangChain / LlamaIndex Agent Execution Trace Inspector Modal */}
      {activeTraceModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            
            {/* Trace Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      LangChain Agent Execution Trace
                    </h3>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {activeTraceModal.framework}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Lead Model: {activeTraceModal.leadModel} • {activeTraceModal.steps.length} Steps in {activeTraceModal.totalDurationMs}ms
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTraceModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trace Query Banner */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Task / User Prompt:
              </span>
              <p className="font-mono text-slate-800 dark:text-slate-200 text-[11px] mt-0.5">
                "{activeTraceModal.query}"
              </p>
            </div>

            {/* Step-by-Step Reasoner Timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {activeTraceModal.steps.map((step) => (
                <div key={step.stepNumber} className="flex gap-3 relative">
                  
                  {/* Step Number Bubble */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      step.type === 'THOUGHT'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                        : step.type === 'RAG_RETRIEVAL'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : step.type === 'TOOL_INVOCATION'
                        ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                        : step.type === 'HITL_VERIFICATION'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {step.stepNumber}
                    </div>
                    {step.stepNumber < activeTraceModal.steps.length && (
                      <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 my-1" />
                    )}
                  </div>

                  {/* Step Card */}
                  <div className="flex-1 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {step.title}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {step.type}
                        </span>
                      </div>
                      {step.durationMs && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {step.description}
                    </p>

                    {/* Tool Input / Output if present */}
                    {step.toolInput && (
                      <div className="mt-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                          Structured Tool Input:
                        </span>
                        <pre className="p-2 rounded bg-slate-900 text-cyan-300 font-mono text-[10px] overflow-x-auto">
                          {JSON.stringify(step.toolInput, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Sources retrieved */}
                    {step.sourcesRetrieved && step.sourcesRetrieved.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Grounded Sources:
                        </span>
                        {step.sourcesRetrieved.map((source, sIdx) => (
                          <div key={sIdx} className="text-[10px] p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-cyan-700 dark:text-cyan-300 truncate font-semibold">
                              {source.docTitle} - {source.section}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">
                              {Math.round((source.relevanceScore || 0.95) * 100)}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Audited &amp; Verified by Oracle AI DBA Sentinel Engine
              </span>
              <button
                type="button"
                onClick={() => setActiveTraceModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close Trace
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
