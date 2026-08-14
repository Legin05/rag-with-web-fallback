import { searchWebWithFallback } from "../mcp-server/src/orchestrator";

export interface CitationItem {
  id: string;
  title: string;
  source: "rag" | "web";
  snippet: string;
  score?: number;
  url?: string;
  page?: number;
}

export interface BridgeSearchResult {
  query: string;
  source: "rag" | "web";
  isWebFallback: boolean;
  citations: CitationItem[];
  contextFormatted: string;
  rawResults: any[];
}

export async function executeSearchBridge(
  question: string,
  searchLimit: number = 5
): Promise<BridgeSearchResult> {
  try {
    const fallbackResponse = await searchWebWithFallback(question, searchLimit);
    const source = fallbackResponse.source as "rag" | "web";
    const isWebFallback = source === "web";
    const citations: CitationItem[] = [];
    const contextParts: string[] = [];

    if (source === "rag" && fallbackResponse.results) {
      fallbackResponse.results.forEach((item: any, index: number) => {
        const text = item.text || "";
        const metadata = item.metadata || {};
        const docName = metadata.source || metadata.file_name || `Doc Chunk #${index + 1}`;
        const pageNum = metadata.page || metadata.chunk_id;
        const score = item.fusion_score ?? item.score;

        citations.push({
          id: item._id ? String(item._id) : `rag-${index}`,
          title: docName,
          source: "rag",
          snippet: text.slice(0, 250) + "...",
          score: score ? Number(score.toFixed(4)) : undefined,
          page: pageNum,
        });

        contextParts.push(
          `[Source: ${docName}${pageNum ? ` (Page/Chunk: ${pageNum})` : ""}]\n${text}`
        );
      });
    } else if (source === "web" && fallbackResponse.results) {
      fallbackResponse.results.forEach((item: any, index: number) => {
        const title = item.title || item.url || `Web Result #${index + 1}`;
        const content = item.content || "";
        const url = item.url;
        const score = item.score;

        citations.push({
          id: `web-${index}`,
          title: title,
          source: "web",
          snippet: content.slice(0, 250) + "...",
          url: url,
          score: score ? Number(score.toFixed(4)) : undefined,
        });

        contextParts.push(
          `[Web Source: ${title} (${url})]\n${content.slice(0, 1000)}`
        );
      });
    }

    const contextFormatted = contextParts.length > 0
      ? contextParts.join("\n\n---\n\n")
      : "No relevant documents or web results found.";

    return {
      query: question,
      source,
      isWebFallback,
      citations,
      contextFormatted,
      rawResults: fallbackResponse.results || [],
    };
  } catch (error: any) {
    console.error("MCP Bridge Error:", error);
    return {
      query: question,
      source: "web",
      isWebFallback: true,
      citations: [],
      contextFormatted: "Context retrieval error occurred. Fallback to general model knowledge.",
      rawResults: [],
    };
  }
}
