import { registerConnect } from "./connect.js";
import { registerListDatabases } from "./list-databases.js";
import { registerListCollections } from "./list-collections.js";
import { registerIndexesTools } from "./indexes.js";
import { registerCollectionSchema } from "./collection-schema.js";
export function registerDataAccessEndpoints(server, globalState) {
    registerConnect(server, globalState);
    registerListDatabases(server, globalState);
    registerListCollections(server, globalState);
    registerIndexesTools(server, globalState);
    registerCollectionSchema(server, globalState);
}
