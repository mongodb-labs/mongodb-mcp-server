import { ApiClient } from "./apiClient.js";
import { State } from "../../state.js";

export async function ensureAuthenticated(state: State, apiClient: ApiClient): Promise<void> {
    if (!(await isAuthenticated(state, apiClient))) {
        throw new Error("Not authenticated");
    }
}

export async function isAuthenticated(state: State, apiClient: ApiClient): Promise<boolean> {
    switch (state.persistent.auth.status) {
        case "not_auth":
            return false;
        case "requested":
            try {
                if (!state.persistent.auth.code) {
                    return false;
                }
                await apiClient.retrieveToken(state.persistent.auth.code.device_code);
                return !!state.persistent.auth.token;
            } catch {
                return false;
            }
        case "issued":
            if (!state.persistent.auth.token) {
                return false;
            }
            return await apiClient.validateToken();
        default:
            throw new Error("Unknown authentication status");
    }
}
