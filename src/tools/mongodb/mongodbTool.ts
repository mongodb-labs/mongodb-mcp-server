import { z } from "zod";
import { ToolBase } from "../tool.js";
import { State } from "../../state.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { CallToolResult, McpError } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCodes } from "../../errors.js";

export type MongoDBToolState = { serviceProvider?: NodeDriverServiceProvider };

export const DbOperationArgs = {
    database: z.string().describe("Database name"),
    collection: z.string().describe("Collection name"),
};

export type DbOperationType = "metadata" | "read" | "create" | "update" | "delete";

export abstract class MongoDBToolBase extends ToolBase {
    constructor(
        state: State,
        protected mongodbState: MongoDBToolState
    ) {
        super(state);
    }

    protected abstract operationType: DbOperationType;

    protected ensureConnected(): NodeDriverServiceProvider {
        const provider = this.mongodbState.serviceProvider;
        if (!provider) {
            throw new McpError(ErrorCodes.NotConnectedToMongoDB, "Not connected to MongoDB");
        }

        return provider;
    }

    protected handleError(error: unknown): CallToolResult | undefined {
        if (error instanceof McpError && error.code === ErrorCodes.NotConnectedToMongoDB) {
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
            };
        }

        return undefined;
    }
}
