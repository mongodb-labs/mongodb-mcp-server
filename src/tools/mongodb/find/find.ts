import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";

const argsShape = {
    collection: z.string().describe("Collection name"),
    database: z.string().describe("Database name"),
    filter: z
        .object({})
        .passthrough()
        .optional()
        .describe("The query filter, matching the syntax of the query argument of db.collection.find()"),
    projection: z
        .object({})
        .passthrough()
        .optional()
        .describe("The projection, matching the syntax of the projection argument of db.collection.find()"),
    limit: z.number().optional().default(10).describe("The maximum number of documents to return"),
};

export class FindTool extends MongoDBToolBase<typeof argsShape> {
    protected name = "find";
    protected description = "Run a find query against a MongoDB collection";
    protected argsShape = argsShape;

    protected async execute({
        database,
        collection,
        filter,
        projection,
        limit,
    }: ToolArgs<typeof argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const documents = await provider.find(database, collection, filter, { projection, limit }).toArray();

        const content: Array<{ text: string; type: "text" }> = [
            {
                text: `Found ${documents.length} documents in the collection \`${collection}\`:`,
                type: "text",
            },
            ...documents.map((doc) => {
                return {
                    text: JSON.stringify(doc),
                    type: "text",
                } as { text: string; type: "text" };
            }),
        ];

        return {
            content,
        };
    }
}
