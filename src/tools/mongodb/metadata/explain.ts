import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";
import { z } from "zod";
import { ExplainVerbosity, Document } from "mongodb";

export class ExplainTool extends MongoDBToolBase {
    protected name = "explain";
    protected description =
        "Returns statistics describing the execution of the winning plan chosen by the query optimizer for the evaluated method";

    protected argsShape = {
        ...DbOperationArgs,
        method: z.enum(["aggregate", "find"]).describe("The method to run"),
        methodArguments: z
            .object({
                aggregatePipeline: z
                    .array(z.object({}).passthrough())
                    .optional()
                    .describe("aggregate - array of aggregation stages to execute"),

                findQuery: z.object({}).passthrough().optional().describe("find - The query to run"),
                findProjection: z.object({}).passthrough().optional().describe("find - The projection to apply"),
            })
            .describe("The arguments for the method"),
    };

    protected operationType: DbOperationType = "metadata";

    protected async execute({
        database,
        collection,
        method,
        methodArguments,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();

        let result: Document;
        switch (method) {
            case "aggregate": {
                result = await provider.aggregate(database, collection).explain();
                break;
            }
            case "find": {
                const query = methodArguments.findQuery ?? {};
                const projection = methodArguments.findProjection ?? {};
                result = await provider
                    .find(database, collection, query, { projection })
                    .explain(ExplainVerbosity.queryPlanner);
                break;
            }
            default:
                throw new Error(`Unsupported method: ${method}`);
        }

        return {
            content: [
                {
                    text: `Here is some information about the winning plan chosen by the query optimizer for running the given \`${method}\` operation in \`${database}\`. This information can be used to understand how the query was executed and to optimize the query performance.`,
                    type: "text",
                },
                {
                    text: JSON.stringify(result),
                    type: "text",
                },
            ],
        };
    }
}
