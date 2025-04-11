import { ToolBase } from "../tool.js";
import { ApiClient } from "../../common/atlas/apiClient.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { State } from "../../state.js";
import { ListClustersTool } from "./listClusters.js";
import { ListProjectsTool } from "./listProjects.js";
import { InspectClusterTool } from "./inspectCluster.js";
import { CreateFreeClusterTool } from "./createFreeCluster.js";
import { CreateAccessListTool } from "./createAccessList.js";
import { InspectAccessListTool } from "./inspectAccessList.js";
import { ListDBUsersTool } from "./listDBUsers.js";
import { CreateDBUserTool } from "./createDBUser.js";

export function registerAtlasTools(server: McpServer, state: State, apiClient?: ApiClient) {
    const tools: ToolBase[] = [
        new ListClustersTool(state, apiClient),
        new ListProjectsTool(state, apiClient),
        new InspectClusterTool(state, apiClient),
        new CreateFreeClusterTool(state, apiClient),
        new CreateAccessListTool(state, apiClient),
        new InspectAccessListTool(state, apiClient),
        new ListDBUsersTool(state, apiClient),
        new CreateDBUserTool(state, apiClient),
    ];

    for (const tool of tools) {
        tool.register(server);
    }
}
