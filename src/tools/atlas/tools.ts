import { ToolBase } from "../tool.js";
import { ApiClient } from "../../common/atlas/client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../../state.js";
import { AuthTool } from "./auth.js";
import { ListClustersTool } from "./listClusters.js";
import { ListProjectsTool } from "./listProjects.js";
import { InspectClusterTool } from "./inspectCluster.js";
import { CreateFreeClusterTool } from "./createFreeCluster.js";

export function registerAtlasTools(server: McpServer, state: State, apiClient: ApiClient) {
    const tools: ToolBase[] = [
        new AuthTool(state, apiClient),
        new ListClustersTool(state, apiClient),
        new ListProjectsTool(state, apiClient),
        new InspectClusterTool(state, apiClient),
        new CreateFreeClusterTool(state, apiClient),
    ];

    for (const tool of tools) {
        tool.register(server);
    }
}
