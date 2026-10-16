import runPythonSearch, { SearchResult } from "./python-client";
import { webSearchAndFetch } from "./web/web-search";


// RRF with k=60 yields 1/(60+1) ~= 0.01639 for rank 1.
// 0.015 ensures that a top-ranked semantic match does not falsely trigger web fallback.
const FALLBACK_THRESHOLD = Number(process.env.FALLBACK_THRESHOLD ?? 0.015);

export async function searchWebWithFallback(
  question: string,
  searchLimit: number = 5
) {
  // Local RAG search
  const ragResults = await runPythonSearch(question);

  // No results
  if (!ragResults || ragResults.length === 0) {
    console.error("[SmartRAG Orchestrator] No local RAG results -> triggering web search");

    const webResults = await webSearchAndFetch(question, searchLimit);

    return {
      source: "web",
      results: webResults,
    };
  }

  // Find best fusion score and best vector similarity score
  const bestScore = Math.max(
    ...ragResults.map((result: any) => result.fusion_score ?? 0)
  );
  const bestVectorScore = Math.max(
    ...ragResults.map((result: any) => result.vector_score ?? 0)
  );

  console.error(
    `[SmartRAG Orchestrator] RAG evaluation: fusion_score=${bestScore.toFixed(4)}, vector_similarity=${bestVectorScore.toFixed(4)}`
  );

  // Confidence check: either strong dual match (fusion >= 0.03) or solid match with high cosine similarity (>= 0.70)
  const isConfident = bestScore >= 0.03 || (bestScore >= FALLBACK_THRESHOLD && bestVectorScore >= 0.70);

  // Local results aren't good enough
  if (!isConfident) {
    console.error("[SmartRAG Orchestrator] Low local confidence -> triggering web search fallback");

    const webResults = await webSearchAndFetch(question, searchLimit);

    return {
      source: "web",
      ragResults,
      results: webResults,
    };
  }

  // Local RAG is sufficient
  console.error("[SmartRAG Orchestrator] Local RAG match sufficient");
  return {
    source: "rag",
    results: ragResults,
  };
}