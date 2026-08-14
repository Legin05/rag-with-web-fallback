import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { executeSearchBridge } from "@/lib/mcp-bridge";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content || "";

    // 1. Retrieve RAG / Web Fallback context via MCP Bridge
    const searchResult = await executeSearchBridge(latestMessage, 5);

    // 2. Build grounded system prompt
    const systemPrompt = `You are an expert AI Assistant powered by a Hybrid RAG Knowledge Base and Web Fallback.
Answer the user's question accurately based on the retrieved context below.

Context Source: ${searchResult.source.toUpperCase()} ${searchResult.isWebFallback ? "🌐 (Web Fallback Active)" : "📚 (Local RAG Match)"}

Retrieved Context Chunks:
${searchResult.contextFormatted}

Instructions:
- If the context contains the answer, cite the sources naturally.
- Be concise, direct, professional, and well-structured using markdown.
- If context is insufficient, state what is missing while answering to the best of your knowledge.`;

    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasGoogleKey = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (hasOpenAIKey) {
      const result = await streamText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        messages,
      });
      return result.toDataStreamResponse({
        headers: {
          "x-search-source": searchResult.source,
          "x-web-fallback": searchResult.isWebFallback ? "true" : "false",
        },
      });
    } else if (hasGoogleKey) {
      const result = await streamText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        messages,
      });
      return result.toDataStreamResponse({
        headers: {
          "x-search-source": searchResult.source,
          "x-web-fallback": searchResult.isWebFallback ? "true" : "false",
        },
      });
    } else {
      // Return ReadableStream formatted for Vercel AI SDK useChat
      const isWeb = searchResult.isWebFallback;
      const summaryText = searchResult.contextFormatted;

      const responseText = searchResult.citations && searchResult.citations.length > 0
        ? `Based on ${isWeb ? "🌐 Web Search Fallback" : "📚 Local Document RAG Match"}, here is the information for your question **"${latestMessage}"**:\n\n${summaryText}\n\n---\n*Citations: ${searchResult.citations.length} sources matched.*`
        : `No specific local or web document match found for **"${latestMessage}"**. Below is the context status:\n\n${summaryText}`;

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`0:${JSON.stringify(responseText)}\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "x-search-source": searchResult.source,
          "x-web-fallback": searchResult.isWebFallback ? "true" : "false",
        },
      });
    }
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
