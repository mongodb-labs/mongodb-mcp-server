import { describe, it } from "@jest/globals";
import { runServer } from "../../src/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// mock the StdioServerTransport
jest.mock("@modelcontextprotocol/sdk/server/stdio");
// mock Server class and its methods
jest.mock("../../src/server.ts", () => {
    return {
        Server: jest.fn().mockImplementation(() => {
            return {
                connect: jest.fn().mockImplementation((transport) => {
                    return new Promise((resolve) => {
                        resolve(transport);
                    });
                }),
            };
        }),
    };
});

describe("Server initialization", () => {
    it("should create a server instance", async () => {
        await runServer();
        expect(StdioServerTransport).toHaveBeenCalled();
    });
});
