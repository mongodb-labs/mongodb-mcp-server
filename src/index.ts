import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; 
import { z } from "zod";

function wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const server = new McpServer({
    name: "MongoDB Atlas",
    version: "1.0.0"
});

var state = {
    auth: false,
}

server.tool("auth", "Authenticate to atlas", async ({}) => {
    await wait(1000);

    setTimeout(() => {
        console.error("Authenticated");
        state.auth = true;
    }, 10000);

    return {
        content: [{ type: "text", text: "Navigate to http://cloud.mongodb.com and input code A56T88." }],
    };
});

server.tool("list-clusters", "Lists clusters", async ({}) => {
    await wait(1000);

    if (!state.auth) {
        return {
            content: [{ type: "text", text: "Not authenticated" }],
        }
    }

    const clusters = [
        { name: "Cluster0", state: "IDLE", connectionString: "mongodb+srv://<username>:<password>@cluster0.mongodb.net/test" },
        { name: "Cluster1", state: "IDLE", connectionString: "mongodb+srv://<username>:<password>@cluster1.mongodb.net/test" },
        { name: "Cluster2", state: "IDLE", connectionString: "mongodb+srv://<username>:<password>@cluster2.mongodb.net/test" },
    ];

    const text = `Cluster Name | State | Connection String
----------------|----------------|----------------
` + clusters.map(cluster => `${cluster.name} | ${cluster.state} | ${cluster.connectionString}`).join("\n");

    return {
        content: [{ type: "text", text }],
    };
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
