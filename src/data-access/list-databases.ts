import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../state.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { ensureConnected } from "./connect.js";
import * as bson from "bson";

export function registerListDatabases(server: McpServer, globalState: State) {
    server.tool(
        "list-databases",
        "List all databases for the current MongoDB connection",
        {},
        async (): Promise<CallToolResult> => {
            const provider = ensureConnected(globalState);
            const dbs = (await provider.listDatabases("")).databases as { name: string; sizeOnDisk: bson.Long }[];

            return {
                content: dbs.map((db) => {
                    return {
                        text: `Name: ${db.name}, Size: ${db.sizeOnDisk} bytes`,
                        type: "text",
                    };
                }),
            };
        }
    );
}
