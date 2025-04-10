import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";
import { parseSchema, SchemaField } from "mongodb-schema";

export class CollectionSchemaTool extends MongoDBToolBase {
    protected name = "collection-schema";
    protected description = "Describe the schema for a collection";
    protected argsShape = DbOperationArgs;

    protected operationType: DbOperationType = "metadata";

    protected async execute({ database, collection }: ToolArgs<typeof DbOperationArgs>): Promise<CallToolResult> {
        const provider = await this.ensureConnected();
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
