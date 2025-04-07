import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../state.js";
import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ensureConnected } from "./connect.js";

export function registerListCollections(server: McpServer, globalState: State) {
    server.tool(
        "list-collections",
        "List all collections for a given database",
        {
            database: z.string().describe("Database name"),
        },
        async ({ database }): Promise<CallToolResult> => {
            const provider = ensureConnected(globalState);
            const collections = await provider.listCollections(database);

            return {
                content: collections.map((collection) => {
                    return {
                        text: `Name: ${collection.name}`,
                        type: "text",
                    };
                }),
            };
        }
    );
}
