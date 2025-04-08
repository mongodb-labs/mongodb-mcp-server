import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoDBToolBase } from "./mongodbTool.js";
import { ToolArgs } from "../tool.js";
import { parseSchema, SchemaField } from "mongodb-schema";

const argsShape = {
    database: z.string().describe("Database name"),
    collection: z.string().describe("Collection name"),
};

export class CollectionSchemaTool extends MongoDBToolBase<typeof argsShape> {
    protected name = "collection-schema";
    protected description = "Describe the schema for a collection";
    protected argsShape = argsShape;

    protected async execute({ database, collection }: ToolArgs<typeof argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const documents = await provider.find(database, collection, {}, { limit: 5 }).toArray();
        const schema = await parseSchema(documents);

        return {
            content: [
                {
                    text: `Found ${schema.fields.length} fields in the schema for \`${database}.${collection}\``,
                    type: "text",
                },
                {
                    text: this.formatFieldOutput(schema.fields),
                    type: "text",
                },
            ],
        };
    }

    private formatFieldOutput(fields: SchemaField[]): string {
        let result = "| Field | Type | Confidence |\n";
        result += "|-------|------|-------------|\n";
        for (const field of fields) {
            result += `| ${field.name} | \`${field.type}\` | ${(field.probability * 100).toFixed(0)}% |\n`;
        }
        return result;
    }
}
