import { INITIAL_RAG_KNOWLEDGE_BASE } from '../data/mockRagKnowledge';
import { RagDocumentChunk } from '../types/llm';

class RagEngine {
  private chunks: RagDocumentChunk[] = [...INITIAL_RAG_KNOWLEDGE_BASE];

  public getAllChunks(): RagDocumentChunk[] {
    return [...this.chunks];
  }

  public addCustomRunbook(doc: {
    docTitle: string;
    category: RagDocumentChunk['category'];
    section: string;
    content: string;
    tags: string[];
    author?: string;
  }): RagDocumentChunk {
    const newChunk: RagDocumentChunk = {
      ...doc,
      id: `rag-custom-${Date.now()}`,
      keywords: doc.tags.concat(doc.docTitle.toLowerCase().split(' ')),
      oracleVersion: 'Oracle 19c / Enterprise',
    };
    this.chunks.unshift(newChunk);
    return newChunk;
  }

  public search(query: string, limit: number = 3): RagDocumentChunk[] {
    if (!query || !query.trim()) {
      return this.chunks.slice(0, limit).map((c) => ({ ...c, relevanceScore: 0.85 }));
    }

    const cleanQuery = query.toLowerCase();
    const queryTokens = cleanQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = this.chunks.map((chunk) => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      const titleLower = chunk.docTitle.toLowerCase();
      const sectionLower = chunk.section.toLowerCase();

      // Check keywords exact match
      chunk.keywords.forEach((kw) => {
        if (cleanQuery.includes(kw.toLowerCase())) {
          score += 0.35;
        }
      });

      // Check tags
      chunk.tags.forEach((tag) => {
        if (cleanQuery.includes(tag.toLowerCase())) {
          score += 0.3;
        }
      });

      // Token matches in content and titles
      queryTokens.forEach((token) => {
        if (titleLower.includes(token)) score += 0.2;
        if (sectionLower.includes(token)) score += 0.25;
        if (contentLower.includes(token)) score += 0.15;
      });

      // Normalize score between 0.45 and 0.99
      const normalizedScore = Math.min(0.99, Math.max(0.45, Number((score > 0 ? 0.65 + score * 0.1 : 0.45).toFixed(2))));

      return {
        ...chunk,
        relevanceScore: normalizedScore,
      };
    });

    // Sort by relevance descending
    scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return scored.slice(0, limit);
  }

  public formatRagPromptContext(chunks: RagDocumentChunk[]): string {
    if (!chunks || chunks.length === 0) return '';

    const lines = [
      '=== [RETRIEVED ORACLE 19c ENTERPRISE RAG KNOWLEDGE BASE] ===',
      'The following official Oracle documentation chunks and internal DBA runbooks were retrieved via vector similarity search to ground your response:',
      '',
    ];

    chunks.forEach((c, idx) => {
      lines.push(`[Source ${idx + 1}]: ${c.docTitle} - ${c.section} (Match Relevance: ${Math.round((c.relevanceScore || 0.85) * 100)}%)`);
      lines.push(`Tags: ${c.tags.join(', ')}`);
      lines.push(c.content);
      lines.push('---');
    });

    lines.push('Ground your answer strictly in these retrieved Oracle runbooks and architectural facts.');
    return lines.join('\n');
  }
}

export const ragEngine = new RagEngine();
