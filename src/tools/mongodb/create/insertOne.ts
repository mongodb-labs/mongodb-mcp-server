import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";

export class InsertOneTool extends MongoDBToolBase {
    protected name = "insert-one";
    protected description = "Insert a document into a MongoDB collection";
    protected argsShape = {
        ...DbOperationArgs,
        document: z
            .object({})
            .passthrough()
            .describe(
                "The document to insert, matching the syntax of the document argument of db.collection.insertOne()"
            ),
    };

    protected operationType: DbOperationType = "create";

    protected async execute({
        database,
        collection,
        document,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const result = await provider.insertOne(database, collection, document);

        return {
            content: [
                {
                    text: `Inserted document with ID \`${result.insertedId}\` into collection \`${collection}\``,
                    type: "text",
                },
            ],
        };
    }
}
