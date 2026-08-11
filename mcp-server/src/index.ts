import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import { webSearchAndFetch } from "./web/web-search.js";

import { searchWebWithFallback } from "./orchestrator.js";
const server = new McpServer({
  name: "rag-mcp-server",
  version: "1.0.0",
});


server.registerTool(
    "search",
    {
        description:   "Search the local RAG knowledge base and fall back to web search when the local results are insufficient.",

        inputSchema: {
            question: z.string().describe(
                "The question to search for in the knowledge base."
            ),
            search_limit: z.number().optional().default(5),
        }
    },
    async ({ question ,search_limit}) => {

        const result = await searchWebWithFallback(
                question,
                search_limit
            );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        result,
                        null,
                        2
                        ),
                }
            ]
        };
    }
);


//another web search tool

server.registerTool(
    "web_search",
    {
        description:"Search the web and fetch useful page content.",
        inputSchema:{
            query: z.string(),
            max_results: z.number().describe("Send the Maximum Url To Fetch").optional().default(5),

        },

 
    },

    async({query, max_results}) =>{
        const results = await webSearchAndFetch(
            query,
            max_results
      );

      return {
        content:[
            {
                type: "text",
                text: JSON.stringify(
                    results,
                    null,
                    2
                ),
            }
        ]
      }
    }
      
)

const transport  = new StdioServerTransport();

await server.connect(transport)