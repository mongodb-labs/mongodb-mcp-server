import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoDBToolBase } from "./mongodbTool.js";
import { ToolArgs } from "../tool.js";
import { IndexDirection } from "mongodb";

const argsShape = {
    database: z.string().describe("Database name"),
    collection: z.string().describe("Collection name"),
    keys: z.record(z.string(), z.custom<IndexDirection>()).describe("The index definition"),
};

export class CreateIndexTool extends MongoDBToolBase<typeof argsShape> {
    protected name = "create-index";
    protected description = "Create an index for a collection";
    protected argsShape = argsShape;

    protected async execute({ database, collection, keys }: ToolArgs<typeof argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const indexes = await provider.createIndexes(database, collection, [
            {
                key: keys,
            },
        ]);

        return {
            content: [
                {
                    text: `Created the index \`${indexes[0]}\``,
                    type: "text",
                },
            ],
        };
    }
}
