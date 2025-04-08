import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../state.js";
import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ensureConnected } from "./connect.js";

export function registerDocumentsTools(server: McpServer, globalState: State) {
    server.tool(
        "find-documents",
        "Run a query against a collection",
        {
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
        },
        async ({ database, collection, filter, projection, limit }): Promise<CallToolResult> => {
            const provider = ensureConnected(globalState);
            const documents = await provider.find(database, collection, filter, { projection, limit }).toArray();

            const content: Array<{ text: string; type: string }> = [
                {
                    text: `Found ${documents.length} documents in the collection \`${collection}\``,
                    type: "text",
                },
                ...documents.map((doc) => {
                    return {
                        text: `Document: \`${JSON.stringify(doc)}\``,
                        type: "text",
                    };
                }),
            ];

            return {
                content: content as any,
            };
        }
    );

    server.tool(
        "insert-document",
        "Insert a document into a collection",
        {
            collection: z.string().describe("Collection name"),
            database: z.string().describe("Database name"),
            document: z
                .object({})
                .passthrough()
                .describe(
                    "The document to insert, matching the syntax of the document argument of db.collection.insertOne()"
                ),
        },
        async ({ database, collection, document }): Promise<CallToolResult> => {
            const provider = ensureConnected(globalState);
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
    );

    // server.tool(
    //     "create-index",
    //     "Create an index for a collection",
    //     {
    //         collection: z.string().describe("Collection name"),
    //         database: z.string().describe("Database name"),
    //         keys: z.record(z.string(), z.custom<IndexDirection>()).describe("The index definition"),
    //     },
    //     async ({ database, collection, keys }): Promise<CallToolResult> => {
    //         const provider = ensureConnected(globalState);
    //         const indexes = await provider.createIndexes(database, collection, [
    //             {
    //                 key: keys,
    //             },
    //         ]);

    //         return {
    //             content: [
    //                 {
    //                     text: `Created the index \`${indexes[0]}\``,
    //                     type: "text",
    //                 },
    //             ],
    //         };
    //     }
    // );
}
