import { ToolBase } from "../tool.js";
import { ApiClient } from "../../common/atlas/apiClient.js";
import { Session } from "../../session.js";

export abstract class AtlasToolBase extends ToolBase {
    private apiClient?: ApiClient;

    ensureApiClient(): asserts this is { apiClient: ApiClient } {
        if (!this.apiClient) {
            if (!config.apiClientId || !config.apiClientSecret) {
                throw new Error(
                    "Not authenticated make sure to configure MCP server with MDB_MCP_API_CLIENT_ID and MDB_MCP_API_CLIENT_SECRET environment variables."
                );
            }

            this.apiClient = new ApiClient({
                baseUrl: config.apiBaseUrl,
                credentials: {
                    clientId: config.apiClientId,
                    clientSecret: config.apiClientSecret,
                },
            });
        }
    }

    constructor(protected readonly session: Session) {
        super(state);
    }
}
