import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "./server.js";

async function runServer() {
    const server = new Server();

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

runServer().catch((error) => {
    console.error(`Fatal error running server:`, error);
    process.exit(1);
});
