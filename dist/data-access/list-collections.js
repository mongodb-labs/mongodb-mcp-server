import { z } from "zod";
import { ensureConnected } from "./connect.js";
export function registerListCollections(server, globalState) {
    server.tool("list-collections", "List all collections for a given database", {
        database: z.string().describe("Database name"),
    }, async ({ database }) => {
        const provider = ensureConnected(globalState);
        const collections = await provider.listCollections(database);
        return {
            content: collections.map((collection) => {
                return {
                    text: `Name: ${collection.name}`,
                    type: "text",
                };
            }),
        };
    });
}
