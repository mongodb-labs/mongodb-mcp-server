import { z } from "zod";
import { CallToolResult, McpError } from "@modelcontextprotocol/sdk/types.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { MongoDBToolBase } from "./mongodbTool.js";
import { ToolArgs } from "../tool";

const argsShape = {
    connectionStringOrClusterName: z
        .string()
        .optional()
        .describe("MongoDB connection string (in the mongodb:// or mongodb+srv:// format) or cluster name"),
};

export class ConnectTool extends MongoDBToolBase<typeof argsShape> {
    protected name = "connect";
    protected description = "Connect to a MongoDB instance";
    protected argsShape = argsShape;

    protected async execute({ connectionStringOrClusterName }: ToolArgs<typeof argsShape>): Promise<CallToolResult> {
        try {
            if (!connectionStringOrClusterName) {
                // TODO: try reconnecting to the default connection
                return {
                    content: [
                        { type: "text", text: "No connection details provided." },
                        { type: "text", text: "Please provide either a connection string or a cluster name" },
                        {
                            type: "text",
                            text: "Alternatively, you can use the default deployment at mongodb://localhost:27017",
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

            await this.connect(connectionString);

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

    private async connect(connectionString: string): Promise<void> {
        const provider = await NodeDriverServiceProvider.connect(connectionString, {
            productDocsLink: "https://docs.mongodb.com/todo-mcp",
            productName: "MongoDB MCP",
        });

        this.mongodbState.serviceProvider = provider;
    }
}
