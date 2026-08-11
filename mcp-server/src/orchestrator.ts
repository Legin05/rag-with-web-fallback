import runPythonSearch, { SearchResult } from "./python-client.js";
import { webSearchAndFetch } from "./web/web-search.js";


const FALLBACK_THRESHOLD = 0.02;


export async function searchWebWithFallback(
    question: string,
    searchLimit: number = 5
) {
    // Local RAG search
  const ragResults = await runPythonSearch(question);


  // No results
  if(!ragResults || ragResults.length === 0){
    console.log("No RAG results → web search");

    const webResults = await webSearchAndFetch(
      question,
      searchLimit
    );

    return {
      source: "web",
      results: webResults,
    };
  }

   // Find best fusion score
  const bestScore = Math.max(
    ...ragResults.map(
      (result: any) =>
        result.fusion_score ?? 0
    )
  );

  console.log(
    "Best RAG fusion score:",
    bestScore
  );

  // Local results aren't good enough
  if (bestScore < FALLBACK_THRESHOLD) {

    console.log(
      "Weak RAG results → web search"
    );

    const webResults = await webSearchAndFetch(
      question,
      searchLimit
    );

    return {
      source: "web",
      ragResults,
      results: webResults,
    };
  }
   
  // Local RAG is sufficient
  return {
    source: "rag",
    results: ragResults,
  };
}