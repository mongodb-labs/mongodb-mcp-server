import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";;
import { ApiClient } from "./client.js";
import { State, saveState, loadState } from "./state.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";;
import { config } from "./config.js";
import { registerResources } from "./resources/register.js";
import { registerTools } from "./tools/register.js";

export class Server {
    state: State | undefined = undefined;
    apiClient: ApiClient | undefined = undefined;
    initialized: boolean = false;

    private async init() {
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

    private createMcpServer(): McpServer {
        const server = new McpServer({
            name: "MongoDB Atlas",
            version: config.version,
        });

        registerResources(server, this.state!, this.apiClient!);
        registerTools(server, this.state!, this.apiClient!);

        
        return server;
    }

    async connect(transport: Transport) {
        await this.init();
        const server = this.createMcpServer();
        await server.connect(transport);
    }
}
