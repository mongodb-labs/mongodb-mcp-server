import { ensureConnected } from "./connect.js";
export function registerListDatabases(server, globalState) {
    server.tool("list-databases", "List all databases for the current MongoDB connection", {}, async () => {
        const provider = ensureConnected(globalState);
        const dbs = (await provider.listDatabases("")).databases;
        return {
            content: dbs.map((db) => {
                return {
                    text: `Name: ${db.name}, Size: ${db.sizeOnDisk} bytes`,
                    type: "text",
                };
            }),
        };
    });
}
