import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";

export class ListCollectionsTool extends MongoDBToolBase {
    protected name = "list-collections";
    protected description = "List all collections for a given database";
    protected argsShape = {
        database: DbOperationArgs.database,
    };

    protected operationType: DbOperationType = "metadata";

    protected async execute({ database }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const collections = await provider.listCollections(database);

        return {
            content: collections.map((collection) => {
                return {
                    text: `Name: ${collection.name}`,
                    type: "text",
                };
            }),
        };
    }
}
