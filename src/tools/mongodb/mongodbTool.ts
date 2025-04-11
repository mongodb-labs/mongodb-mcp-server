import { z } from "zod";
import { ToolBase } from "../tool.js";
import { State } from "../../state.js";
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
    constructor(state: State) {
        super(state);
    }

    protected abstract operationType: DbOperationType;

    protected async ensureConnected(): Promise<NodeDriverServiceProvider> {
        const provider = this.state.serviceProvider;
        if (!provider && config.connectionString) {
            await this.connectToMongoDB(config.connectionString, this.state);
        }

        if (!provider) {
            throw new MongoDBError(ErrorCodes.NotConnectedToMongoDB, "Not connected to MongoDB");
        }

        return provider;
    }

    protected handleError(error: unknown): CallToolResult | undefined {
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
            };
        }

        return undefined;
    }

    protected async connectToMongoDB(connectionString: string, state: State): Promise<void> {
        const provider = await NodeDriverServiceProvider.connect(connectionString, {
            productDocsLink: "https://docs.mongodb.com/todo-mcp",
            productName: "MongoDB MCP",
            readConcern: config.connectOptions.readConcern,
            readPreference: config.connectOptions.readPreference,
            writeConcern: {
                w: config.connectOptions.writeConcern,
            },
            timeoutMS: config.connectOptions.timeoutMS,
        });

        state.serviceProvider = provider;
        state.credentials.connectionString = connectionString;
        await state.persistCredentials();
    }
}
