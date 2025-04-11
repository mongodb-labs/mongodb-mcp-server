import { ToolBase } from "../tool.js";
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

export function registerAtlasTools(server: McpServer, state: State) {
    const tools: ToolBase[] = [
        new ListClustersTool(state),
        new ListProjectsTool(state),
        new InspectClusterTool(state),
        new CreateFreeClusterTool(state),
        new CreateAccessListTool(state),
        new InspectAccessListTool(state),
        new ListDBUsersTool(state),
        new CreateDBUserTool(state),
    ];

    for (const tool of tools) {
        tool.register(server);
    }
}
