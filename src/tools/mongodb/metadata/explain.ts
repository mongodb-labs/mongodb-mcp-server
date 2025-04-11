import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DbOperationArgs, DbOperationType, MongoDBToolBase } from "../mongodbTool.js";
import { ToolArgs } from "../../tool.js";
import { z } from "zod";
import { ExplainVerbosity, Document } from "mongodb";
import { AggregateArgs } from "../read/aggregate.js";
import { FindArgs } from "../read/find.js";
import { CountArgs } from "../read/count.js";

export class ExplainTool extends MongoDBToolBase {
    protected name = "explain";
    protected description =
        "Returns statistics describing the execution of the winning plan chosen by the query optimizer for the evaluated method";

    protected argsShape = {
        ...DbOperationArgs,
        method: z
            .array(
                z.union([
                    z.object({
                        name: z.literal("aggregate"),
                        arguments: z.object(AggregateArgs),
                    }),
                    z.object({
                        name: z.literal("find"),
                        arguments: z.object(FindArgs),
                    }),
                    z.object({
                        name: z.literal("count"),
                        arguments: z.object(CountArgs),
                    }),
                ])
            )
            .describe("The method and its arguments to run"),
    };

    protected operationType: DbOperationType = "metadata";

    static readonly defaultVerbosity = ExplainVerbosity.queryPlanner;

    protected async execute({
        database,
        collection,
        method: methods,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const method = methods[0];

        if (!method) {
            throw new Error("No method provided");
        }

        let result: Document;
        switch (method.name) {
            case "aggregate": {
                const { pipeline, limit } = method.arguments;
                result = await provider
                    .aggregate(database, collection, pipeline)
                    .limit(limit)
                    .explain(ExplainTool.defaultVerbosity);
                break;
            }
            case "find": {
                const { filter, ...rest } = method.arguments;
                result = await provider
                    .find(database, collection, filter, { ...rest })
                    .explain(ExplainTool.defaultVerbosity);
                break;
            }
            case "count": {
                const { query } = method.arguments;
                // This helper doesn't have explain() command but does have the argument explain
                result = (await provider.count(database, collection, query, {
                    explain: ExplainTool.defaultVerbosity,
                })) as unknown as Document;
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
