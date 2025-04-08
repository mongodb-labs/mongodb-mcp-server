import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "./client.js";
import { saveState, loadState } from "./state.js";
import { registerAtlasTools } from "./tools/atlas/index.js";
import { registerMongoDBTools } from "./tools/mongodb/index.js";
import { config } from "./config.js";
export class Server {
    constructor() {
        this.state = undefined;
        this.apiClient = undefined;
        this.initialized = false;
    }
    async init() {
        if (this.initialized) {
            return;
        }
        this.state = await loadState();
        this.apiClient = new ApiClient({
            token: this.state?.auth.token,
            saveToken: (token) => {
                if (!this.state) {
                    throw new Error("State is not initialized");
                }
                this.state.auth.code = undefined;
                this.state.auth.token = token;
                this.state.auth.status = "issued";
                saveState(this.state);
            },
        });
        this.initialized = true;
    }
    createMcpServer() {
        const server = new McpServer({
            name: "MongoDB Atlas",
            version: config.version,
        });
        registerAtlasTools(server, this.state, this.apiClient);
        registerMongoDBTools(server, this.state);
        return server;
    }
    async connect(transport) {
        await this.init();
        const server = this.createMcpServer();
        await server.connect(transport);
    }
}
//# sourceMappingURL=server.js.map