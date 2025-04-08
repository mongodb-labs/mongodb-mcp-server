import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../../state.js";
import { ConnectTool } from "./connect.js";
import { ListCollectionsTool } from "./listCollections.js";
import { CollectionIndexesTool } from "./collectionIndexes.js";
import { ListDatabasesTool } from "./listDatabases.js";
import { MongoDBToolState } from "./mongodbTool.js";
import { CreateIndexTool } from "./createIndex.js";
import { CollectionSchemaTool } from "./collectionSchema.js";
import { InsertOneTool } from "./insert/insertOne.js";
import { FindTool } from "./find/find.js";

export function registerMongoDBTools(server: McpServer, state: State) {
    const mongodbToolState: MongoDBToolState = {};

    const tools = [
        ConnectTool,
        ListCollectionsTool,
        ListDatabasesTool,
        CollectionIndexesTool,
        CreateIndexTool,
        CollectionSchemaTool,
        InsertOneTool,
        FindTool,
    ];

    for (const tool of tools) {
        const instance = new tool(state, mongodbToolState);
        instance.register(server);
    }
}
