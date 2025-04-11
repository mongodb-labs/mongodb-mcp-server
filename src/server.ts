import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "./common/atlas/apiClient.js";
import defaultState, { State } from "./state.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { registerAtlasTools } from "./tools/atlas/tools.js";
import { registerMongoDBTools } from "./tools/mongodb/index.js";
import config from "./config.js";
import logger, { initializeLogger } from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";

export class Server {
    state: State = defaultState;
    apiClient?: ApiClient;
    initialized: boolean = false;
    private server?: McpServer;

    private async init() {
        if (this.initialized) {
            return;
        }

        await this.state.loadCredentials();

        if (config.apiClientId && config.apiClientSecret) {
            this.apiClient = new ApiClient({
                credentials: {
                    clientId: config.apiClientId!,
                    clientSecret: config.apiClientSecret,
                },
            });
        }

        this.initialized = true;
    }

    async connect(transport: Transport) {
        await this.init();
        const server = new McpServer({
            name: "MongoDB Atlas",
            version: config.version,
        });

        server.server.registerCapabilities({ logging: {} });

        registerAtlasTools(server, this.state, this.apiClient);
        registerMongoDBTools(server, this.state);

        await server.connect(transport);
        await initializeLogger(server);
        this.server = server;

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
