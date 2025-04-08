import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoDBToolBase } from "./mongodbTool.js";
import { ToolArgs } from "../tool.js";

const argsShape = {
    database: z.string().describe("Database name"),
    collection: z.string().describe("Collection name"),
};

export class ListIndexesTool extends MongoDBToolBase<typeof argsShape> {
    protected name = "list-indexes";
    protected description = "Describe the indexes for a collection";
    protected argsShape = argsShape;

    protected async execute({ database, collection }: ToolArgs<typeof argsShape>): Promise<CallToolResult> {
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
