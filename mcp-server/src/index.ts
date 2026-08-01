import { McpServer } from "@modelcontextprotocol/server";
import z from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
const server = new McpServer({
    name: "rag-server",
    version: "1.0.0"
})



server.registerTool(
    "search_documents",
    {
        description: "Search the RAG knowledge base for relevant documents.",

        inputSchema: {
            question: z.string()
        }
    },
    async ({ question }) => {

        console.error("Question:", question);

        return {
            content: [
                {
                    type: "text",
                    text: `Searching for: ${question}`
                }
            ]
        };
    }
);


const transport  = new StdioServerTransport();

await server.connect(transport)