import { ZodRawShape } from "zod";
import { ToolBase } from "../tool.js";
import { ApiClient } from "../../client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../../state.js";
import { AuthTool } from "./auth.js";
import { ListClustersTool } from "./listClusters.js";
import { ListProjectsTool } from "./listProjects.js";

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
