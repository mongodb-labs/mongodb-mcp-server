import { z } from "zod";
import { ensureConnected } from "./connect.js";
import { parseSchema } from "mongodb-schema";
export function registerCollectionSchema(server, globalState) {
    server.tool("collection-schema", "Describe the schema for a collection", {
        collection: z.string().describe("Collection name"),
        database: z.string().describe("Database name"),
    }, async ({ database, collection }) => {
        const provider = ensureConnected(globalState);
        const documents = await provider.find(database, collection, {}, { limit: 5 }).toArray();
        const schema = await parseSchema(documents);
        return {
            content: schema.fields.map((field) => {
                return {
                    text: formatFieldOutput(field),
                    type: "text",
                };
            }),
        };
    });
}
function formatFieldOutput(field) {
    let result = `Field: **${field.name}**: \`${field.type}\``;
    if (field.probability !== 1) {
        result += ` (${(field.probability * 100).toFixed(0)}% confidence)`;
    }
    return result;
}
