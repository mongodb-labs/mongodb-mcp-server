import { ApiClient } from "./apiClient.js";
import { State } from "../../state.js";

export async function ensureAuthenticated(state: State, apiClient: ApiClient): Promise<void> {
    if (!(await isAuthenticated(state, apiClient))) {
        throw new Error("Not authenticated");
    }
}

export async function isAuthenticated(state: State, apiClient: ApiClient): Promise<boolean> {
    switch (state.credentials.auth.status) {
        case "not_auth":
            return false;
        case "requested":
            try {
                if (!state.credentials.auth.code) {
                    return false;
                }
                await apiClient.retrieveToken(state.credentials.auth.code.device_code);
                return !!state.credentials.auth.token;
            } catch {
                return false;
            }
        case "issued":
            if (!state.credentials.auth.token) {
                return false;
            }
            return await apiClient.validateToken();
        default:
            throw new Error("Unknown authentication status");
    }
}
