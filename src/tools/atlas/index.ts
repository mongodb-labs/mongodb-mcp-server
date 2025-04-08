import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../../state.js";
import { ApiClient } from "../../client.js";
import { ToolBase } from "../tool.js";
import { AuthTool } from "./auth.js";
import { ListClustersTool } from "./listClusters.js";
import { ListProjectsTool } from "./listProjects.js";
import { ZodRawShape } from "zod";

export function registerAtlasTools(server: McpServer, state: State, apiClient: ApiClient) {
    const tools: ToolBase<ZodRawShape>[] = [
        new AuthTool(apiClient),
        new ListClustersTool(apiClient),
        new ListProjectsTool(apiClient),
    ];

    for (const tool of tools) {
        tool.register(server, state);
    }
}
