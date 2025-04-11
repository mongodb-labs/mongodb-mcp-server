import { z } from "zod";
import { ToolBase } from "../tool.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCodes, MongoDBError } from "../../errors.js";
import config from "../../config.js";

export const DbOperationArgs = {
    database: z.string().describe("Database name"),
    collection: z.string().describe("Collection name"),
};

export type DbOperationType = "metadata" | "read" | "create" | "update" | "delete";

export abstract class MongoDBToolBase extends ToolBase {
    constructor(private serviceProvider: NodeDriverServiceProvider | undefined) {
        super();
    }

    protected abstract operationType: DbOperationType;

    protected async ensureConnected(): Promise<NodeDriverServiceProvider> {
        if (!this.serviceProvider && config.connectionString) {
            this.serviceProvider = await this.connectToMongoDB(config.connectionString);
        }

        if (!this.serviceProvider) {
            throw new MongoDBError(ErrorCodes.NotConnectedToMongoDB, "Not connected to MongoDB");
        }

        return this.serviceProvider;
    }

    protected handleError(error: unknown): Promise<CallToolResult> | CallToolResult {
        if (error instanceof MongoDBError && error.code === ErrorCodes.NotConnectedToMongoDB) {
            return {
                content: [
                    {
                        type: "text",
                        text: "You need to connect to a MongoDB instance before you can access its data.",
                    },
                    {
                        type: "text",
                        text: "Please use the 'connect' tool to connect to a MongoDB instance.",
                    },
                ],
                isError: true,
            };
        }

        return super.handleError(error);
    }

    protected async connectToMongoDB(connectionString: string): Promise<NodeDriverServiceProvider> {
        return NodeDriverServiceProvider.connect(connectionString, {
            productDocsLink: "https://docs.mongodb.com/todo-mcp",
            productName: "MongoDB MCP",
            readConcern: {
                level: config.connectOptions.readConcern,
            },
            readPreference: config.connectOptions.readPreference,
            writeConcern: {
                w: config.connectOptions.writeConcern,
            },
            timeoutMS: config.connectOptions.timeoutMS,
        });
    }
}
