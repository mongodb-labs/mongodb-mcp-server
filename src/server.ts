import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "./state.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { registerAtlasTools } from "./tools/atlas/tools.js";
import { registerMongoDBTools } from "./tools/mongodb/index.js";
import logger, { initializeLogger } from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";
import { ApiClient } from "./common/atlas/apiClient.js";

export class Server {
    public readonly state: State;
    private readonly mcpServer: McpServer;

    constructor({ mcpServer, state, transport }: { mcpServer: McpServer; state: State; transport: Transport }) {
        this.mcpServer = server;
        this.state = new State();
    }

    async connect(transport: Transport) {
        this.server = new McpServer({
            name: "MongoDB Atlas",
            version: config.version,
        });

        this.server.server.registerCapabilities({ logging: {} });

        registerAtlasTools(this.server, this.state);
        registerMongoDBTools(this.server, this.state);

        await initializeLogger(this.server);
        await this.server.connect(transport);

        logger.info(mongoLogId(1_000_004), "server", `Server started with transport ${transport.constructor.name}`);
    }

    async close(): Promise<void> {
        try {
            await this.state.serviceProvider?.close(true);
        } catch {
            // Ignore errors during service provider close
        }
        await this.server?.close();
    }
}
