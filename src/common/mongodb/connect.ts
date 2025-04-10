import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { State } from "../../state.js";
import config from "../../config.js";

export async function connectToMongoDB(connectionString: string, state: State): Promise<void> {
    const provider = await NodeDriverServiceProvider.connect(connectionString, {
        productDocsLink: "https://docs.mongodb.com/todo-mcp",
        productName: "MongoDB MCP",
        readConcern: config.connectOptions.readConcern,
        readPreference: config.connectOptions.readPreference,
        writeConcern: {
            w: config.connectOptions.writeConcern,
        },
        timeoutMS: config.connectOptions.timeoutMS,
    });

    state.serviceProvider = provider;
    state.credentials.connectionString = connectionString;
    await state.persistCredentials();
}
