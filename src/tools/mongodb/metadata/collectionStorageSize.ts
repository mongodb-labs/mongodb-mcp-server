import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";

export class CollectionStorageSizeTool extends MongoDBToolBase {
    protected name = "collection-storage-size";
    protected description = "Gets the size of the collection in MB";
    protected argsShape = DbOperationArgs;

    protected operationType: DbOperationType = "metadata";

    protected async execute({ database, collection }: ToolArgs<typeof DbOperationArgs>): Promise<CallToolResult> {
        const provider = await this.ensureConnected();
        const [{ value }] = await provider
            .aggregate(database, collection, [
                { $collStats: { storageStats: {} } },
                { $group: { _id: null, value: { $sum: "$storageStats.storageSize" } } },
            ])
            .toArray();

        return {
            content: [
                {
                    text: `The size of \`${database}.${collection}\` is \`${(value / 1024 / 1024).toFixed(2)} MB\``,
                    type: "text",
                },
            ],
        };
    }
}
