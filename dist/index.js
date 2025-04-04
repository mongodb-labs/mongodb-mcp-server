#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
const server = new mcp_js_1.McpServer({
    name: "MongoDB Atlas",
    version: "1.0.0"
});
var state = {
    auth: false,
};
server.tool("auth", "Authenticate to atlas", (_a) => __awaiter(void 0, [_a], void 0, function* ({}) {
    yield wait(1000);
    setTimeout(() => {
        console.error("Authenticated");
        state.auth = true;
    }, 10000);
    return {
        content: [{ type: "text", text: "Navigate to http://cloud.mongodb.com and input code A56T88." }],
    };
}));
server.tool("list-clusters", "Lists clusters", (_a) => __awaiter(void 0, [_a], void 0, function* ({}) {
    yield wait(1000);
    if (!state.auth) {
        return {
            content: [{ type: "text", text: "Not authenticated" }],
        };
    }
    const clusters = [
        { name: "Cluster0", state: "IDLE", connectionString: "mongodb+srv://<username>:<password>@cluster0.mongodb.net/test" },
        { name: "Cluster1", state: "IDLE", connectionString: "mongodb+srv://<username>:<password>@cluster1.mongodb.net/test" },
        { name: "Cluster2", state: "IDLE", connectionString: "mongodb+srv://<username>:<password>@cluster2.mongodb.net/test" },
    ];
    const text = `Cluster Name | State | Connection String
----------------|----------------|----------------
` + clusters.map(cluster => `${cluster.name} | ${cluster.state} | ${cluster.connectionString}`).join("\n");
    return {
        content: [{ type: "text", text }],
    };
}));
function runServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new stdio_js_1.StdioServerTransport();
        yield server.connect(transport);
    });
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
