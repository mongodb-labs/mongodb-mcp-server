import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import logger from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";
import { ApiClient } from "./common/atlas/apiClient.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import config from "./config.js";
import { State } from "./state.js";
import { registerAtlasTools } from "./tools/atlas/tools.js";
import { registerMongoDBTools } from "./tools/mongodb/index.js";

try {
    const state = new State();
    await state.loadCredentials();

    const apiClient = ApiClient.fromState(state);

    const mcp = new McpServer({
        name: "MongoDB Atlas",
        version: config.version,
    });

    mcp.server.registerCapabilities({ logging: {} });

    registerAtlasTools(mcp, state, apiClient);
    registerMongoDBTools(mcp, state);

    const transport = new StdioServerTransport();
    await mcp.server.connect(transport);
} catch (error) {
    logger.emergency(mongoLogId(1_000_004), "server", `Fatal error running server: ${error}`);

    process.exit(1);
}
