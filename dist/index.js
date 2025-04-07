#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { defineTools } from "./tools.js";
// Set process env version
process.env.VERSION = "1.0.0";
// Initialize server with logging capability
const server = new McpServer({
    name: "MongoDB Atlas",
    version: process.env.VERSION,
    capabilities: {
        logging: { enabled: true },
        tools: { listChanged: false }
    }
});
// Explicitly register capabilities on the underlying server
server.server.registerCapabilities({
    logging: { enabled: true },
    tools: { enabled: true },
});
export function log(targetLevel, data) {
    console.error(`${targetLevel}: ${data}`);
    // // Convert objects to string for better logging
    // const message = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    // // Always log to console as a fallback
    // console[targetLevel === "debug" ? "log" : targetLevel](message);
    // // Only attempt MCP logging after the server is connected
    // if (server.server && server.server.transport) {
    //     try {
    //         // Use the underlying Server instance which has the sendLoggingMessage method
    //         server.server.sendLoggingMessage({
    //             level: targetLevel,
    //             data: message,
    //         });
    //     } catch (e) {
    //         // Just use console logging if MCP logging fails
    //         console.error("MCP logging failed, using console logging instead");
    //     }
    // }
}
export const globalState = {
    auth: false,
};
// Register tools defined in tools.ts
defineTools(server, globalState);
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // const response = await callAtlasAPI<any>('/groups/6273e01999910271a6b56768/clusters');
    // console.error(response);
}
runServer().catch((error) => {
    console.error(`Fatal error running server:`, error);
    process.exit(1);
});
