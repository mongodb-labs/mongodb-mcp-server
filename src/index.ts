import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; 
import { z } from "zod";
import express, { Request, Response } from "express"; // Fixing type imports
import dotenv from "dotenv";
dotenv.config();

// Replace require() with dynamic import for node-fetch
const fetchDynamic = async () => (await import("node-fetch")).default;

function wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const server = new McpServer({
    name: "MongoDB Atlas",
    version: "1.0.0"
});

// Define types for deviceCodeData and tokenData
interface DeviceCodeData {
    verification_uri: string;
    user_code: string;
    interval: number;
    device_code: string;
}

interface TokenData {
    access_token: string;
}

// Move clientId to a state variable
var state = {
    auth: false,
    token: "", // Added token property
    deviceCode: "",
    verificationUri: "",
    userCode: "",
    clientId: process.env.CLIENT_ID || "0oabtxactgS3gHIR0297", // Moved clientId to state
};

const app = express();
let authCode = "";

app.get("/callback", (req: Request, res: Response) => {
    authCode = req.query.code as string;
    res.send("Authentication successful! You can close this tab.");
});

// Update the device code request to align with the Atlas Go SDK
server.tool("auth", "Authenticate to Atlas", async ({}) => {
    console.log("Starting authentication process...");
    const authUrl = "https://cloud.mongodb.com/api/private/unauth/account/device/authorize"; // Updated endpoint

    console.log("Client ID:", state.clientId);

    // Step 1: Request a device code
    const deviceCodeResponse = await (await fetchDynamic())(authUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: state.clientId, // Use state.clientId
            scope: "openid",
        }).toString(),
    });

    const responseText = await deviceCodeResponse.text(); // Capture the full response body
    console.log("Device Code Response Body:", responseText);

    if (!deviceCodeResponse.ok) {
        console.error("Failed to initiate authentication:", deviceCodeResponse.statusText);
        return {
            content: [{ type: "text", text: `Failed to initiate authentication: ${deviceCodeResponse.statusText}` }],
        };
    }

    const deviceCodeData = JSON.parse(responseText) as DeviceCodeData; // Parse the response body
    console.log(`Please authenticate by visiting the following URL: ${deviceCodeData.verification_uri}`);
    console.log(`Enter the code: ${deviceCodeData.user_code}`);

    // Store the device code data for further use
    state.deviceCode = deviceCodeData.device_code;
    state.verificationUri = deviceCodeData.verification_uri;
    state.userCode = deviceCodeData.user_code;

    return {
        content: [
            { type: "text", text: `Please authenticate by visiting ${deviceCodeData.verification_uri} and entering the code ${deviceCodeData.user_code}` },
        ],
    };
});

// Add PollToken functionality to the auth tool
server.tool("poll-token", "Poll for Access Token", async ({}) => {
    console.log("Starting token polling process...");

    if (!state.deviceCode) {
        console.error("Device code not found. Please initiate authentication first.");
        return {
            content: [{ type: "text", text: "Device code not found. Please initiate authentication first." }],
        };
    }

    const tokenEndpoint = "https://cloud.mongodb.com/api/private/unauth/account/device/token";
    const interval = 5 * 1000; // Default polling interval in milliseconds
    const expiresAt = Date.now() + 15 * 60 * 1000; // Assume 15 minutes expiration for the device code

    while (Date.now() < expiresAt) {
        await wait(interval);

        try {
            const tokenResponse = await (await fetchDynamic())(tokenEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: state.clientId, // Use state.clientId
                    device_code: state.deviceCode,
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                }).toString(),
            });

            const responseText = await tokenResponse.text();
            console.log("Token Response Body:", responseText);

            if (tokenResponse.ok) {
                const tokenData = JSON.parse(responseText) as TokenData;
                console.log("Authentication successful. Token received:", tokenData.access_token);

                // Store the token
                state.auth = true;
                state.token = tokenData.access_token;

                return {
                    content: [{ type: "text", text: "Authentication successful! You are now logged in." }],
                };
            } else {
                console.error("Token Response Error:", responseText);
                const errorResponse = JSON.parse(responseText);
                if (errorResponse.error === "authorization_pending") {
                    console.log("Authorization pending. Retrying...");
                    continue;
                } else if (errorResponse.error === "expired_token") {
                    console.error("Device code expired. Please restart the authentication process.");
                    return {
                        content: [{ type: "text", text: "Device code expired. Please restart the authentication process." }],
                    };
                } else {
                    console.error("Failed to authenticate:", errorResponse.error_description || "Unknown error");
                    return {
                        content: [{ type: "text", text: `Failed to authenticate: ${errorResponse.error_description || "Unknown error"}` }],
                    };
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Unexpected error during token polling:", error);
                return {
                    content: [{ type: "text", text: `Unexpected error during token polling: ${error.message}` }],
                };
            } else {
                console.error("Unexpected non-Error object during token polling:", error);
                return {
                    content: [{ type: "text", text: "Unexpected error during token polling." }],
                };
            }
        }
    }

    console.error("Authentication timed out. Please restart the process.");
    return {
        content: [{ type: "text", text: "Authentication timed out. Please restart the process." }],
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
