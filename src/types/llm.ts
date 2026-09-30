export interface LocalLlmConfig {
  provider: 'ollama' | 'vllm' | 'lmstudio' | 'localai' | 'gemini_hybrid';
  baseUrl: string; // e.g. "http://localhost:11434"
  modelName: string; // e.g. "llama3.2:latest", "qwen2.5-coder:32b", "mistral-small"
  isLead: boolean; // whether Local LLM is the designated lead model
  temperature: number;
  maxTokens: number;
  topP: number;
  systemInstruction: string;
  isConnected: boolean;
  latencyMs?: number;
  lastChecked?: string;
}

export interface RagDocumentChunk {
  id: string;
  docTitle: string;
  category: 'CBO_TUNING' | 'SECURITY_CIS' | 'ERROR_RESOLUTION' | 'SOP_RUNBOOK' | 'STORAGE_ASM';
  section: string;
  content: string;
  tags: string[];
  keywords: string[];
  relevanceScore?: number; // 0.0 - 1.0 (or percentage)
  embeddingMock?: number[];
  author?: string;
  oracleVersion?: string;
}

export interface LangChainAgentStep {
  stepNumber: number;
  type: 'THOUGHT' | 'RAG_RETRIEVAL' | 'TOOL_INVOCATION' | 'HITL_VERIFICATION' | 'OBSERVATION' | 'FINAL_SYNTHESIS';
  title: string;
  description: string;
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: any;
  sourcesRetrieved?: RagDocumentChunk[];
  timestamp: string;
  durationMs?: number;
}

export interface AgentExecutionTrace {
  id: string;
  query: string;
  leadModel: string;
  provider: string;
  framework: 'LangChain Agent' | 'LlamaIndex QueryEngine';
  steps: LangChainAgentStep[];
  totalDurationMs: number;
  ragChunksUsed: number;
}
