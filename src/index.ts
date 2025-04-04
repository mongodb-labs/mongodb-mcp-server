import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; 
import express, { Request, Response } from "express"; 


// Import the necessary modules
import { loadToken, pollToken, authenticate, authState, isAuthenticated, AuthState } from "./auth.js";

import dotenv from "dotenv";
dotenv.config();


function wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const server = new McpServer({
    name: "MongoDB Atlas",
    version: "1.0.0"
});


export interface GlobalState {
    auth: boolean;
    
}

export const globalState: GlobalState = {
    auth: false,
};

// Update references to state in the server tools
server.tool("auth", "Authenticate to Atlas", async ({}) => {
    const authResult = await isAuthenticated()
    if (authResult) {
        console.log("Already authenticated!");
        return {
            content: [{ type: "text", text: "You are already authenticated!" }],
        };
    }

    try {
        // Step 1: Generate the device code
        const { verificationUri, userCode } = await authenticate();

        // Inform the user to authenticate
        const initialResponse = {
            content: [
                { type: "text", text: `Please authenticate by visiting ${verificationUri} and entering the code ${userCode}` },
                { type: "text", text: "Polling for token..." }
            ] as Array<{ type: "text"; text: string }>, // Explicitly typed to match the expected structure
        };

        // Start polling for the token asynchronously
        pollToken().then(_ => {
            globalState.auth = true;
            console.log("Authentication successful!");
        }).catch(error => {
            console.error("Token polling failed:", error);
        });

        return initialResponse;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Authentication error:", error);
            return {
                content: [{ type: "text", text: `Authentication failed: ${error.message}` }],
            };
        } else {
            console.error("Unknown authentication error:", error);
            return {
                content: [{ type: "text", text: "Authentication failed due to an unknown error." }],
            };
        }
    }
});

server.tool("list-clusters", "Lists clusters", async ({}) => {
    await wait(1000);

    if (!globalState.auth) {
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
