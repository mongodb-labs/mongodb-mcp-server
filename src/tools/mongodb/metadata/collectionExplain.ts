import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";
import { parseSchema, SchemaField } from "mongodb-schema";
import { z } from "zod";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { ExplainVerbosity } from "mongodb";

export class CollectionExplainTool extends MongoDBToolBase {
    protected name = "collection-explain";
    protected description = "Returns statistics describing the execution of the winning plan for the evaluated method";

    static supportedOperations = [
        "aggregate",
        "count",
        "distinct",
        "find",
        "findAndModify",
        "delete",
        "mapReduce",
        "update",
    ] as const;

    protected argsShape = {
        ...DbOperationArgs,
        operation: z.enum(CollectionExplainTool.supportedOperations).describe("Method to explain"),
        operationsArguments: z.any().describe("Arguments used by the method to be explained"),
    };

    protected operationType: DbOperationType = "metadata";

    protected async execute({
        database,
        collection,
        operation,
        operationsArguments,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();

        const documents = await provider.runCommand(database, {
            explain: operation,
            verbosity: ExplainVerbosity.queryPlanner,
        });

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
