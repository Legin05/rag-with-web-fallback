import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import {spawn} from "child_process"
import runPythonSearch from "./helper.js";
import { webSearchAndFetch } from "./web/web-search.js";
const server = new McpServer({
  name: "rag-mcp-server",
  version: "1.0.0",
});


server.registerTool(
    "search_knowledge_base",
    {
        description: "Search the knowledge base using hybrid vector and text search.",

        inputSchema: {
            question: z.string().describe(
                "The question to search for in the knowledge base."
            )
        }
    },
    async ({ question }) => {

        const result = await runPythonSearch(question);

        return {
            content: [
                {
                    type: "text",
                    text: result
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