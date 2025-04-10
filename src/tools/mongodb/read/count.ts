import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";
import { z } from "zod";

export class CountTool extends MongoDBToolBase {
    protected name = "count";
    protected description = "Gets the number of documents in a MongoDB collection";
    protected argsShape = {
        ...DbOperationArgs,
        query: z
            .object({})
            .passthrough()
            .optional()
            .describe(
                "The query filter to count documents. Matches the syntax of the filter argument of db.collection.count()"
            ),
    };

    protected operationType: DbOperationType = "metadata";

    protected async execute({ database, collection, query }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = await this.ensureConnected();
        const count = await provider.count(database, collection, query);

        return {
            content: [
                {
                    text: `Found ${count} documents in the collection \`${collection}\``,
                    type: "text",
                },
            ],
        };
    }
}
