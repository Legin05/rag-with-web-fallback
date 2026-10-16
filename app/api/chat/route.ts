import { NextRequest } from "next/server";
import { streamText, StreamData } from "ai";
import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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

    const data = new StreamData();
    const meta = {
      type: "search_metadata",
      source: searchResult.source,
      isWebFallback: searchResult.isWebFallback,
      citations: searchResult.citations,
    };
    data.appendMessageAnnotation(meta);
    data.append(meta);

    const hasOpenAIKey = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your_");
    const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasGoogleKey = !!googleApiKey && !googleApiKey.includes("your_");

    if (hasOpenAIKey) {
      try {
        const result = await streamText({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          messages,
          onFinish: () => {
            data.close();
          },
        });
        return result.toDataStreamResponse({
          data,
          headers: {
            "x-search-source": searchResult.source,
            "x-web-fallback": searchResult.isWebFallback ? "true" : "false",
          },
        });
      } catch (llmError: any) {
        console.warn("OpenAI generation failed, falling back to direct context stream:", llmError.message);
      }
    }

    if (hasGoogleKey) {
      try {
        const google = createGoogleGenerativeAI({
          apiKey: googleApiKey,
        });
        const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
        const result = await streamText({
          model: google(modelName),
          system: systemPrompt,
          messages,
          onFinish: () => {
            data.close();
          },
        });
        return result.toDataStreamResponse({
          data,
          headers: {
            "x-search-source": searchResult.source,
            "x-web-fallback": searchResult.isWebFallback ? "true" : "false",
          },
        });
      } catch (llmError: any) {
        console.warn("Gemini generation failed, trying backup model or direct context:", llmError.message);
        // Try fallback to gemini-2.5-flash-lite if available
        try {
          const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
          const result = await streamText({
            model: google("gemini-2.5-flash-lite"),
            system: systemPrompt,
            messages,
            onFinish: () => {
              data.close();
            },
          });
          return result.toDataStreamResponse({
            data,
            headers: {
              "x-search-source": searchResult.source,
              "x-web-fallback": searchResult.isWebFallback ? "true" : "false",
            },
          });
        } catch (backupError: any) {
          console.warn("Backup Gemini model failed:", backupError.message);
        }
      }
    }

    // Direct stream fallback when LLM is unavailable or keys are missing
    data.close();
    const isWeb = searchResult.isWebFallback;
    const summaryText = searchResult.contextFormatted;

    const responseText = searchResult.citations && searchResult.citations.length > 0
      ? `Based on ${isWeb ? "🌐 Web Search Fallback" : "📚 Local Document RAG Match"}, here is the retrieved knowledge for **"${latestMessage}"**:\n\n${summaryText}\n\n---\n*Citations: ${searchResult.citations.length} sources retrieved.*`
      : `No specific local or web document match found for **"${latestMessage}"**. Below is the context status:\n\n${summaryText}`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            `2:[${JSON.stringify({
              type: "search_metadata",
              source: searchResult.source,
              isWebFallback: searchResult.isWebFallback,
              citations: searchResult.citations,
            })}]\n`
          )
        );
        controller.enqueue(encoder.encode(`0:${JSON.stringify(responseText)}\n`));
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{}}\n`));
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
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
