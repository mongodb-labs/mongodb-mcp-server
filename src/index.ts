#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import logger from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";
import { ApiClient } from "./common/atlas/apiClient.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import config from "./config.js";
import { State } from "./state.js";
import { Server } from "./server.js";

try {
    const state = new State();
    const mcpServer = new McpServer({
        name: "MongoDB Atlas",
        version: config.version,
    });
    const transport = new StdioServerTransport();

    const server = new Seriver({
        mcpServer,
        state,
        transport,
    });

    await server.registerAndConnect();
} catch (error) {
    logger.emergency(mongoLogId(1_000_004), "server", `Fatal error running server: ${error}`);

    process.exit(1);
}
