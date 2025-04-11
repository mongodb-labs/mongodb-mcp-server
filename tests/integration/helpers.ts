import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "./inMemoryTransport.js";
import { Server } from "../../src/server.js";
import runner, { MongoCluster } from "mongodb-runner";
import path from "path";
import fs from "fs/promises";

export async function setupIntegrationTest(): Promise<{
    client: Client;
    server: Server;
    teardown: () => Promise<void>;
}> {
    const clientTransport = new InMemoryTransport();
    const serverTransport = new InMemoryTransport();

    await serverTransport.start();
    await clientTransport.start();

    clientTransport.output.pipeTo(serverTransport.input);
    serverTransport.output.pipeTo(clientTransport.input);

    const client = new Client(
        {
            name: "test-client",
            version: "1.2.3",
        },
        {
            capabilities: {},
        }
    );

    const server = new Server();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    return {
        client,
        server,
        teardown: async () => {
            await client.close();
            await server.close();
        },
    };
}

export async function runMongoDB(): Promise<runner.MongoCluster> {
    const tmpDir = path.join(__dirname, "..", "tmp");
    await fs.mkdir(tmpDir, { recursive: true });

    try {
        const cluster = await MongoCluster.start({
            tmpDir: path.join(tmpDir, "mongodb-runner", "dbs"),
            logDir: path.join(tmpDir, "mongodb-runner", "logs"),
            topology: "standalone",
        });

        return cluster;
    } catch (err) {
        throw err;
    }
}

export function validateToolResponse(content: unknown): string {
    expect(Array.isArray(content)).toBe(true);

    const response = content as Array<{ type: string; text: string }>;
    for (const item of response) {
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("text");
        expect(item.type).toBe("text");
    }

    return response.map((item) => item.text).join("\n");
}
