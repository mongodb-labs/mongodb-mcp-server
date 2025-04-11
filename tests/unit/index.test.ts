import { describe, it } from "@jest/globals";
import { Session } from "../../src/session";

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
        const state = new Session();

        expect(state.credentials).toEqual({
            auth: {
                status: "not_auth",
            },
        });
    });
});
