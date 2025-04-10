import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "./server.js";
import logger from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";

async function runServer() {
    const server = new Server();

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

runServer().catch((error) => {
    logger.emergency(mongoLogId(1_000_004), "server", `Fatal error running server: ${error}`);

    process.exit(1);
});
