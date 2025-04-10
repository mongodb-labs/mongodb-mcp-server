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
    apiClient: ApiClient | undefined = undefined;
    initialized: boolean = false;

    private async init() {
        if (this.initialized) {
            return;
        }

        await this.state.loadCredentials();

        this.apiClient = new ApiClient({
            token: this.state.credentials.auth.token,
            saveToken: async (token) => {
                if (!this.state) {
                    throw new Error("State is not initialized");
                }
                this.state.credentials.auth.code = undefined;
                this.state.credentials.auth.token = token;
                this.state.credentials.auth.status = "issued";
                await this.state.persistCredentials();
            },
        });

        this.initialized = true;
    }

    private createMcpServer(): McpServer {
        const server = new McpServer({
            name: "MongoDB Atlas",
            version: config.version,
        });

        server.server.registerCapabilities({ logging: {} });

        registerAtlasTools(server, this.state, this.apiClient!);
        registerMongoDBTools(server, this.state);

        return server;
    }

    async connect(transport: Transport) {
        await this.init();
        const server = this.createMcpServer();
        await server.connect(transport);
        await initializeLogger(server);

        logger.info(mongoLogId(1_000_004), "server", `Server started with transport ${transport.constructor.name}`);
    }
}
