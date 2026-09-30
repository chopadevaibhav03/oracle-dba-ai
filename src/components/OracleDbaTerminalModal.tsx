import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { DatabaseTarget, TerminalExecutionResult } from '../types/oracle';
import {
  Check,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCommand?: string;
  currentDb?: DatabaseTarget;
  onCommandExecuted?: () => void;
  onToast?: (message: string) => void;
  onRequestHitlApproval?: (request: any) => void;
}

interface TerminalHistoryItem {
  id: string;
  command: string;
  output: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  timestamp: string;
  durationMs: number;
  prompt: string;
  auditEntryId?: string;
}

const PRESET_COMMANDS = [
  { label: 'Run OpenSCAP Scan', cmd: 'oscap xccdf eval --profile cis_server_l1' },
  { label: 'Automate VAPT Audit', cmd: 'vapt audit' },
  { label: 'Remediate All Findings', cmd: 'vapt remediate --all' },
  { label: 'View Active Sessions', cmd: 'SELECT * FROM v$session;' },
  { label: 'Check Tablespace TDE', cmd: 'SELECT * FROM dba_tablespaces;' },
  { label: 'Show Security Params', cmd: 'SHOW PARAMETER remote_os_authent' },
  { label: 'DB Health Status', cmd: 'status' },
];

export const OracleDbaTerminalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialCommand,
  currentDb,
  onCommandExecuted,
  onToast,
  onRequestHitlApproval,
}) => {
  const [command, setCommand] = useState(initialCommand || '');
  const [history, setHistory] = useState<TerminalHistoryItem[]>([
    {
      id: 'init-1',
      command: 'connect / as sysdba',
      output: `Connected to: Oracle Database 19c Enterprise Edition Release 19.18.0.0.0 - 64bit Production\nContainer: PDB_FIN_CORE (CDB$ROOT)\nType 'help' for available SQL*Plus, OpenSCAP (oscap), and VAPT commands.`,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleTimeString(),
      durationMs: 32,
      prompt: 'SQL> ',
    },
  ]);
  const [commandHistoryIndex, setCommandHistoryIndex] = useState<number>(-1);
  const [sentCommands, setSentCommands] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCommand) {
      setCommand(initialCommand);
    }
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, initialCommand]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleExecute = async (cmdToRun?: string) => {
    const rawCmd = cmdToRun !== undefined ? cmdToRun : command;
    const trimmed = rawCmd.trim();
    if (!trimmed || isExecuting) return;

    if (trimmed.toLowerCase() === 'clear' || trimmed.toLowerCase() === 'cls') {
      setHistory([]);
      setCommand('');
      return;
    }

    const lower = trimmed.toLowerCase();
    const isCritical = lower.includes('kill session') || lower.includes('drop ') || lower.includes('vapt remediate') || lower.includes('remote_os_authent=false');
    if (isCritical && onRequestHitlApproval) {
      onRequestHitlApproval({
        id: `hitl-term-${Date.now()}`,
        title: `Authorize Production Command Execution: ${trimmed.slice(0, 45)}`,
        actionType: 'TERMINAL_DDL',
        riskLevel: 'HIGH',
        blastRadius: 'Direct interactive DBA terminal modification on database instance.',
        database: currentDb?.name || 'PROD_RAC01 (PDB_FIN_CORE)',
        commands: [trimmed],
        rollbackCommand: '-- Manual rollback command required for custom DDL',
        initiator: 'DBA Operator (Terminal)',
        payload: { command: trimmed },
      });
      return;
    }

    setIsExecuting(true);
    setSentCommands((prev) => [...prev, trimmed]);
    setCommandHistoryIndex(-1);

    try {
      const { result } = await api.executeTerminalCommand(trimmed);

      if (result.output === '__CLEAR__') {
        setHistory([]);
      } else {
        const newItem: TerminalHistoryItem = {
          id: `term-${Date.now()}`,
          command: trimmed,
          output: result.output,
          status: result.status,
          timestamp: new Date().toLocaleTimeString(),
          durationMs: result.executionTimeMs,
          prompt: result.prompt || 'SQL> ',
          auditEntryId: result.auditEntryId,
        };
        setHistory((prev) => [...prev, newItem]);

        if (result.auditEntryId) {
          onToast?.(`Command executed and logged to audit trail (ID: ${result.auditEntryId})`);
        }
      }

      setCommand('');
      onCommandExecuted?.();
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: `term-err-${Date.now()}`,
          command: trimmed,
          output: `ORA-00900: invalid SQL or execution error: ${err?.message || 'Execution failed'}`,
          status: 'ERROR',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 40,
          prompt: 'SQL> ',
        },
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (sentCommands.length > 0) {
        const nextIdx = commandHistoryIndex === -1 ? sentCommands.length - 1 : Math.max(0, commandHistoryIndex - 1);
        setCommandHistoryIndex(nextIdx);
        setCommand(sentCommands[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistoryIndex !== -1) {
        const nextIdx = commandHistoryIndex + 1;
        if (nextIdx < sentCommands.length) {
          setCommandHistoryIndex(nextIdx);
          setCommand(sentCommands[nextIdx]);
        } else {
          setCommandHistoryIndex(-1);
          setCommand('');
        }
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className={`relative w-full bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'h-[96vh] max-w-[98vw]' : 'h-[85vh] max-w-5xl'
        }`}
      >
        {/* Terminal Title Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 font-mono">
                oracle-dba-sentinel@rac-node01:~$ sqlplus -s / as sysdba
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 hidden sm:inline">
                {currentDb?.name || 'PROD_RAC01 (PDB_FIN_CORE)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistory([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear terminal buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-950/80 transition-colors cursor-pointer"
              title="Close terminal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Command Toolbar */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 whitespace-nowrap">
            Quick Actions:
          </span>
          {PRESET_COMMANDS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCommand(preset.cmd);
                handleExecute(preset.cmd);
              }}
              className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] font-mono border border-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5 text-cyan-400" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Terminal Output Area */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-4 bg-slate-950 text-slate-200">
          {history.map((item) => (
            <div key={item.id} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">{item.prompt}</span>
                  <span className="text-slate-100 font-semibold">{item.command}</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-slate-500">{item.durationMs}ms</span>
                  <button
                    onClick={() => copyToClipboard(item.output, item.id)}
                    className="p-1 hover:text-cyan-400 text-slate-500 rounded"
                    title="Copy command output"
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border leading-relaxed whitespace-pre-wrap ${
                  item.status === 'ERROR'
                    ? 'bg-red-950/20 border-red-800/40 text-red-300'
                    : item.status === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-emerald-300'
                }`}
              >
                {item.output}
              </div>
            </div>
          ))}

          {isExecuting && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs py-2">
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Executing against Oracle database engine...</span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Command Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <div className="flex items-center gap-1 text-cyan-400 font-mono font-bold text-xs select-none">
            <span>SQL&gt;</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter SQL, DDL, oscap, vapt audit, or type 'help'..."
            disabled={isExecuting}
            className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none placeholder:text-slate-600"
          />

          <button
            onClick={() => handleExecute()}
            disabled={!command.trim() || isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Execute</span>
          </button>
        </div>

      </div>
    </div>
  );
};
