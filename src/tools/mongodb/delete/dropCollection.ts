import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";

export class DropCollectionTool extends MongoDBToolBase {
    protected name = "drop-collection";
    protected description =
        "Removes a collection or view from the database. The method also removes any indexes associated with the dropped collection.";
    protected argsShape = {
        ...DbOperationArgs,
    };
    protected operationType: DbOperationType = "delete";

    protected async execute({ database, collection }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const result = await provider.dropCollection(database, collection);

        return {
            content: [
                {
                    text: `${result ? "Successfully dropped" : "Failed to drop"} collection \`${collection}\` from database \`${database}\``,
                    type: "text",
                },
            ],
        };
    }
}
