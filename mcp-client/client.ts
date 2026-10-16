import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "../mcp-server");

export async function createMcpClient() {
  const client = new Client(
    {
      name: "smartrag-mcp-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const isWindows = process.platform === "win32";
  const command = isWindows ? "npx.cmd" : "npx";
  const transport = new StdioClientTransport({
    command,
    args: ["tsx", "src/index.ts"],
    cwd: serverDir,
  });

  await client.connect(transport);
  return { client, transport };
}

export async function askQuestion(question: string) {
  console.log(`\n🔍 Querying SmartRAG: "${question}"...\n`);
  const { client, transport } = await createMcpClient();

  try {
    const tools = await client.listTools();
    console.log("Connected to MCP Server. Available tools:", tools.tools.map((t) => t.name).join(", "));

    const response: any = await client.callTool({
      name: "search",
      arguments: {
        question,
        search_limit: 5,
      },
    });

    const contentText = response.content?.[0]?.text;
    if (contentText) {
      const parsed = JSON.parse(contentText);
      const isWeb = parsed.source === "web";
      console.log("\n=======================================================");
      console.log(isWeb ? "🌐 SOURCE: WEB FALLBACK ACTIVE" : "📚 SOURCE: LOCAL RAG MATCH");
      console.log("=======================================================\n");

      if (parsed.results && parsed.results.length > 0) {
        console.log(`Found ${parsed.results.length} result(s):`);
        parsed.results.forEach((item: any, i: number) => {
          const title = item.title || item.metadata?.source || `Result #${i + 1}`;
          const snippet = item.content || item.text || "";
          console.log(`\n[${i + 1}] ${title}`);
          if (item.url) console.log(`    URL: ${item.url}`);
          if (item.fusion_score !== undefined) console.log(`    Score: ${Number(item.fusion_score).toFixed(4)}`);
          console.log(`    Snippet: ${snippet.slice(0, 180)}...`);
        });
      } else {
        console.log("No relevant documents or web results found.");
      }
    } else {
      console.log("Empty response from MCP tool.");
    }
  } finally {
    await transport.close();
  }
}

// Allow direct CLI execution
const query = process.argv.slice(2).join(" ") || "What is Spring Boot?";
askQuestion(query).catch((err) => {
  console.error("Client Error:", err);
  process.exit(1);
});
