import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport";

// Mock modules with proper typing
jest.mock("@modelcontextprotocol/sdk/server/stdio", () => ({
    StdioServerTransport: jest.fn().mockImplementation(() => ({} as Transport)),
}));

// Properly type the mock function to return Promise<void>
const mockConnect = jest.fn<() => Promise<void>>().mockResolvedValue();
jest.mock("../../src/server", () => ({
    Server: jest.fn().mockImplementation(() => ({
        state: undefined,
        apiClient: undefined,
        initialized: false,
        connect: mockConnect,
    })),
}));

describe("Server initialization", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it("should create a server instance", async () => {
        const { Server } = await import("../../src/server");
        const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio");

        // Import the module under test
        await import("../../src/index");

        expect(Server).toHaveBeenCalledTimes(1);
        expect(StdioServerTransport).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
    });
});
