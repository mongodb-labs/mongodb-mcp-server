import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../state.js";
import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ensureConnected } from "./connect.js";
import { IndexDirection } from "mongodb";

export function registerIndexesTools(server: McpServer, globalState: State) {
    server.tool(
        "list-indexes",
        "Describe the indexes for a collection",
        {
            collection: z.string().describe("Collection name"),
            database: z.string().describe("Database name"),
        },
        async ({ database, collection }): Promise<CallToolResult> => {
            const provider = ensureConnected(globalState);
            const indexes = await provider.getIndexes(database, collection);

            return {
                content: indexes.map((indexDefinition) => {
                    return {
                        text: `Field: ${indexDefinition.name}: ${JSON.stringify(indexDefinition.key)}`,
                        type: "text",
                    };
                }),
            };
        }
    );

    server.tool(
        "create-index",
        "Create an index for a collection",
        {
            collection: z.string().describe("Collection name"),
            database: z.string().describe("Database name"),
            keys: z.record(z.string(), z.custom<IndexDirection>()).describe("The index definition"),
        },
        async ({ database, collection, keys }): Promise<CallToolResult> => {
            const provider = ensureConnected(globalState);
            const indexes = await provider.createIndexes(database, collection, [
                {
                    key: keys,
                },
            ]);

            return {
                content: [
                    {
                        text: `Created the index \`${indexes[0]}\``,
                        type: "text",
                    },
                ],
            };
        }
    );
}
