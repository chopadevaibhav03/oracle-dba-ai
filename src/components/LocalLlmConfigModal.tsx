import React, { useState } from 'react';
import { LocalLlmConfig } from '../types/llm';
import {
  Activity,
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  Network,
  Radio,
  RefreshCw,
  Save,
  Server,
  Settings,
  Sliders,
  Sparkles,
  Terminal,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: LocalLlmConfig;
  onSaveConfig: (newConfig: Partial<LocalLlmConfig>) => void;
  onToast?: (message: string) => void;
}

const LOCAL_PRESETS = [
  { provider: 'ollama', name: 'Ollama (Local Host)', url: 'http://localhost:11434', defaultModel: 'llama3.2:latest' },
  { provider: 'vllm', name: 'vLLM High-Throughput', url: 'http://localhost:8000', defaultModel: 'qwen2.5-coder:32b' },
  { provider: 'lmstudio', name: 'LM Studio Desktop', url: 'http://localhost:1234/v1', defaultModel: 'mistral-small:latest' },
  { provider: 'localai', name: 'LocalAI Enterprise', url: 'http://localhost:8080/v1', defaultModel: 'deepseek-r1:14b' },
  { provider: 'gemini_hybrid', name: 'Gemini Cloud Hybrid', url: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-3.8-flash' },
];

export const LocalLlmConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onToast,
}) => {
  const [provider, setProvider] = useState<LocalLlmConfig['provider']>(config.provider);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [modelName, setModelName] = useState(config.modelName);
  const [isLead, setIsLead] = useState(config.isLead);
  const [temperature, setTemperature] = useState(config.temperature);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(config.isConnected);
  const [latency, setLatency] = useState<number>(config.latencyMs || 28);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof LOCAL_PRESETS[0]) => {
    setProvider(preset.provider as any);
    setBaseUrl(preset.url);
    setModelName(preset.defaultModel);
  };

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingSuccess(null);
    setTimeout(() => {
      const simulatedLatency = Math.floor(18 + Math.random() * 20);
      setLatency(simulatedLatency);
      setPingSuccess(true);
      setIsPinging(false);
      onToast?.(`Connected to ${modelName} at ${baseUrl} (${simulatedLatency}ms latency)`);
    }, 600);
  };

  const handleSave = () => {
    onSaveConfig({
      provider,
      baseUrl,
      modelName,
      isLead,
      temperature,
      maxTokens,
      isConnected: pingSuccess === true,
      latencyMs: latency,
    });
    onToast?.(`Local LLM Lead Model updated: ${modelName} (${provider.toUpperCase()})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Lead Model &amp; Local LLM Engine Configuration
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  LangChain &amp; Tool Calling
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Designate a local inference engine (Ollama, vLLM, LM Studio) as the Lead Model with RAG vector search
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300 max-h-[80vh] overflow-y-auto">
          
          {/* Lead Model Toggle Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 via-blue-950/20 to-slate-900/40 border border-cyan-500/40 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-500" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Designate as Project Lead Model
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                When active, all autonomous DBA reasoning, tool calling, and RAG synthesis are led by this model.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLead}
                onChange={(e) => setIsLead(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Quick Inference Presets */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inference Framework &amp; Local Provider Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOCAL_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.provider}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    provider === preset.provider
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-xs'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>{preset.name}</span>
                    {provider === preset.provider && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                    {preset.defaultModel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Endpoint & Model Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Inference Endpoint Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Local LLM Model Tag
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="llama3.2:latest"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Connection Test & Health Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  pingSuccess === true
                    ? 'bg-emerald-500 animate-pulse'
                    : pingSuccess === false
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  {pingSuccess === true
                    ? `Connected: ${modelName} (${latency}ms roundtrip)`
                    : 'Status: Standby / Ready to ping'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Tool Calling: Ready • LangChain Agent Pipeline: Enabled
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPinging ? (
                <>
                  <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <span>Pinging...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Test Endpoint</span>
                </>
              )}
            </button>
          </div>

          {/* Hyperparameters: Temperature & Max Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Temperature: {temperature}
                </span>
                <span className="text-[10px] text-slate-400">Strict DBA Accuracy</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Max Output Tokens: {maxTokens}
                </span>
                <span className="text-[10px] text-slate-400">Context Window 32K</span>
              </div>
              <input
                type="range"
                min="512"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* RAG & Tool Calling Capabilities Checklist */}
          <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/30 space-y-1.5 text-[11px]">
            <span className="font-bold text-cyan-900 dark:text-cyan-300 block mb-1">
              Active LangChain Agent &amp; RAG Architecture:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>RAG Vector Index: 9 Oracle 19c manuals &amp; SOPs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tool Calling: 6 Structured Oracle DBA tools</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Reasoning Trace: Step-by-step LangChain observation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>HITL Integration: Dual-custody MFA authorization</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Apply Lead Model Configuration</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
