import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, MongoDBToolBase } from "./mongodbTool.js";
import { ToolArgs } from "../tool.js";

export class CollectionIndexesTool extends MongoDBToolBase<typeof DbOperationArgs> {
    protected name = "collection-indexes";
    protected description = "Describe the indexes for a collection";
    protected argsShape = DbOperationArgs;

    protected async execute({ database, collection }: ToolArgs<typeof DbOperationArgs>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const indexes = await provider.getIndexes(database, collection);

        return {
            content: indexes.map((indexDefinition) => {
                return {
                    text: `Field: ${indexDefinition.name}: ${JSON.stringify(indexDefinition.key)}`,
                    type: "text",
                };
            }),
        };
    }
}
