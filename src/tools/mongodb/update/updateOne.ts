import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";

export class UpdateOneTool extends MongoDBToolBase {
    protected name = "update-one";
    protected description = "Updates a single document within the collection based on the filter";
    protected argsShape = {
        collection: z.string().describe("Collection name"),
        database: z.string().describe("Database name"),
        filter: z
            .object({})
            .passthrough()
            .optional()
            .describe(
                "The selection criteria for the update, matching the syntax of the filter argument of db.collection.updateOne()"
            ),
        update: z
            .object({})
            .passthrough()
            .optional()
            .describe("An update document describing the modifications to apply using update operator expressions"),
        upsert: z
            .boolean()
            .optional()
            .describe("Controls whether to insert a new document if no documents match the filter"),
    };
    protected operationType: DbOperationType = "update";

    protected async execute({
        database,
        collection,
        filter,
        update,
        upsert,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const result = await provider.updateOne(database, collection, filter, update, {
            upsert,
        });

        let message = "";
        if (result.matchedCount === 0) {
            message = `No documents matched the filter.`;
        } else {
            message = `Matched ${result.matchedCount} document(s).`;
            if (result.modifiedCount > 0) {
                message += ` Modified ${result.modifiedCount} document(s).`;
            }
            if (result.upsertedCount > 0) {
                message += ` Upserted ${result.upsertedCount} document(s) (with id: ${result.upsertedId}).`;
            }
        }

        return {
            content: [
                {
                    text: message,
                    type: "text",
                },
            ],
        };
    }
}
