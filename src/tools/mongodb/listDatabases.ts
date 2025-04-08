import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoDBToolBase } from "./mongodbTool.js";
import * as bson from "bson";

export class ListDatabasesTool extends MongoDBToolBase {
    protected name = "list-databases";
    protected description = "List all databases for a MongoDB connection";
    protected argsShape = {};

    protected async execute(): Promise<CallToolResult> {
        const provider = this.ensureConnected();
        const dbs = (await provider.listDatabases("")).databases as { name: string; sizeOnDisk: bson.Long }[];

        return {
            content: dbs.map((db) => {
                return {
                    text: `Name: ${db.name}, Size: ${db.sizeOnDisk} bytes`,
                    type: "text",
                };
            }),
        };
    }
}
