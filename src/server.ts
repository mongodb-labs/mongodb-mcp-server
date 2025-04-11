import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "./common/atlas/apiClient.js";
import { State } from "./state.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { registerAtlasTools } from "./tools/atlas/tools.js";
import { registerMongoDBTools } from "./tools/mongodb/index.js";
import logger, { initializeLogger } from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";

export class Server {
    readonly state: State;
    private readonly apiClient: ApiClient;
    private readonly mcpServer: McpServer;
    private readonly transport: Transport;

    constructor({
        state,
        apiClient,
        mcpServer,
        transport,
    }: {
        state: State;
        apiClient: ApiClient;
        mcpServer: McpServer;
        transport: Transport;
    }) {
        this.state = state;
        this.apiClient = apiClient;
        this.mcpServer = mcpServer;
        this.transport = transport;
    }

    async registerAndConnect() {
        this.mcpServer.server.registerCapabilities({ logging: {} });

        registerAtlasTools(this.mcpServer, this.state, this.apiClient);
        registerMongoDBTools(this.mcpServer, this.state);

        await this.mcpServer.connect(this.transport);

        await initializeLogger(this.mcpServer);

        logger.info(
            mongoLogId(1_000_004),
            "server",
            `Server started with transport ${this.transport.constructor.name}`
        );
    }

    async close(): Promise<void> {
        try {
            await this.state.serviceProvider?.close(true);
        } catch {
            // Ignore errors during service provider close
        }
        await this.mcpServer.close();
    }
}
