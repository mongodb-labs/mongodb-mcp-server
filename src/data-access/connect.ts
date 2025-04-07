import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../state.js";
import { z } from "zod";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";

export function registerConnect(server: McpServer, globalState: State) {
    server.tool(
        "connect",
        "Connect to a MongoDB instance",
        {
            connectionStringOrClusterName: z
                .string()
                .optional()
                .describe("MongoDB connection string (in the mongodb:// or mongodb+srv:// format) or cluster name"),
        },
        async ({ connectionStringOrClusterName }) => {
            try {
                if (!connectionStringOrClusterName) {
                    return {
                        content: [
                            { type: "text", text: "No connection details provided." },
                            { type: "text", text: "Please provide either a connection string or a cluster name" },
                            {
                                type: "text",
                                text: "Alternatively, you can ask the model to use the default deployment at mongodb://localhost:27017",
                            },
                        ],
                    };
                }

                let connectionString: string;

                if (typeof connectionStringOrClusterName === "string") {
                    if (
                        connectionStringOrClusterName.startsWith("mongodb://") ||
                        connectionStringOrClusterName.startsWith("mongodb+srv://")
                    ) {
                        connectionString = connectionStringOrClusterName;
                    } else {
                        // TODO:
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Connecting via cluster name not supported yet. Please provide a connection string.`,
                                },
                            ],
                        };
                    }
                } else {
                    throw new McpError(2, "Invalid connection options");
                }

                await connect(connectionString, globalState);

                return {
                    content: [{ type: "text", text: `Successfully connected to ${connectionString}.` }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: "Failed to get cluster connection string" }],
                    isError: true,
                };
            }
        }
    );
}

async function connect(connectionString: string, globalState: State): Promise<void> {
    const provider = await NodeDriverServiceProvider.connect(connectionString, {
        productDocsLink: "https://docs.mongodb.com/todo-mcp",
        productName: "MongoDB MCP",
    });

    globalState.serviceProvider = provider;
}

export function ensureConnected(globalState: State): NodeDriverServiceProvider {
    if (!globalState.serviceProvider) {
        throw new McpError(1, "Not connected to MongoDB");
    }

    return globalState.serviceProvider;
}
