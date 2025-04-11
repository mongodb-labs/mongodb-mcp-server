import { ToolBase } from "../tool.js";
import { ApiClient } from "../../common/atlas/apiClient.js";
import { State } from "../../state.js";

export abstract class AtlasToolBase extends ToolBase {
    constructor(
        state: State,
        protected apiClient?: ApiClient
    ) {
        super(state);
    }

    protected ensureAuthenticated(): void {
        if (!this.apiClient) {
            throw new Error(
                "Not authenticated make sure to configure MCP server with MDB_MCP_API_CLIENT_ID and MDB_MCP_API_CLIENT_SECRET environment variables."
            );
        }
    }
}
