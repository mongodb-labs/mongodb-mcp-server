import { AuthTool } from "./auth.js";
import { ListClustersTool } from "./listClusters.js";
import { ListProjectsTool } from "./listProjects.js";
export function registerAtlasTools(server, state, apiClient) {
    const tools = [
        new AuthTool(apiClient),
        new ListClustersTool(apiClient),
        new ListProjectsTool(apiClient),
    ];
    for (const tool of tools) {
        tool.register(server, state);
    }
}
//# sourceMappingURL=index.js.map