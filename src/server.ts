import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Session } from "./session.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { AtlasTools } from "./tools/atlas/tools.js";
import { MongoDbTools } from "./tools/mongodb/index.js";
import logger, { initializeLogger } from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";

export class Server {
    public readonly session: Session;
    private readonly mcpServer: McpServer;
    private readonly transport: Transport;

    constructor({ mcpServer, transport, session }: { mcpServer: McpServer; session: Session; transport: Transport }) {
        this.mcpServer = mcpServer;
        this.transport = transport;
        this.session = session;
    }

    async connect() {
        this.mcpServer.server.registerCapabilities({ logging: {} });

        this.registerTools();

        await initializeLogger(this.mcpServer);

        await this.mcpServer.connect(this.transport);

        logger.info(
            mongoLogId(1_000_004),
            "server",
            `Server started with transport ${this.transport.constructor.name}`
        );
    }

    async close(): Promise<void> {
        try {
            await this.session.serviceProvider?.close(true);
        } catch {
            // Ignore errors during service provider close
        }
        await this.mcpServer?.close();
    }

    private registerTools() {
        for (const tool of [...AtlasTools, ...MongoDbTools]) {
            new tool(this.session).register(this.mcpServer);
        }
    }
}
