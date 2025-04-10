import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import {runServer} from "../../src/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";


// mock the StdioServerTransport
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
// mock Server class and its methods
jest.mock('../../src/server.ts', () => {
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
        const server = await runServer();
        expect(StdioServerTransport).toHaveBeenCalled();
    });
});
