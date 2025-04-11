import { describe, it } from "@jest/globals";
import { runServer } from "../../src/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { State } from "../../src/state";

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
    it("should define a default state", async () => {
        const state = new State();

        expect(state.credentials).toEqual({
            auth: {
                status: "not_auth",
            },
        });
    });
});
