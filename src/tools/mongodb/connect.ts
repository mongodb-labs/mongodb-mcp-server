import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { DbOperationType, MongoDBToolBase } from "./mongodbTool.js";
import { ToolArgs } from "../tool";
import { ErrorCodes, MongoDBError } from "../../errors.js";

export class ConnectTool extends MongoDBToolBase {
    protected name = "connect";
    protected description = "Connect to a MongoDB instance";
    protected argsShape = {
        connectionStringOrClusterName: z
            .string()
            .optional()
            .describe("MongoDB connection string (in the mongodb:// or mongodb+srv:// format) or cluster name"),
    };

    protected operationType: DbOperationType = "metadata";

    protected async execute({
        connectionStringOrClusterName,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
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
            throw new MongoDBError(ErrorCodes.InvalidParams, "Invalid connection options");
        }

        await this.connect(connectionString);

        return {
            content: [{ type: "text", text: `Successfully connected to ${connectionString}.` }],
        };
    }

    private async connect(connectionString: string): Promise<void> {
        const provider = await NodeDriverServiceProvider.connect(connectionString, {
            productDocsLink: "https://docs.mongodb.com/todo-mcp",
            productName: "MongoDB MCP",
        });

        this.mongodbState.serviceProvider = provider;
    }
}
