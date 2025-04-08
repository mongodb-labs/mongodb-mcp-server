import { ZodRawShape } from "zod";
import { ToolBase } from "../tool.js";
import { State } from "../../state.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCodes } from "../../errors.js";

export type MongoDBToolState = { serviceProvider?: NodeDriverServiceProvider };

export abstract class MongoDBToolBase<Args extends ZodRawShape = ZodRawShape> extends ToolBase<Args> {
    constructor(
        state: State,
        protected mongodbState: MongoDBToolState
    ) {
        super(state);
    }

    protected ensureConnected(): NodeDriverServiceProvider {
        const provider = this.mongodbState.serviceProvider;
        if (!provider) {
            throw new McpError(ErrorCodes.NotConnectedToMongoDB, `Not connected to MongoDB instance with name ${name}`);
        }

        return provider;
    }
}
