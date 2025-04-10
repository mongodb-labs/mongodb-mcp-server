import { ApiClient } from "./apiClient";
import { State } from "../../state";

export async function ensureAuthenticated(state: State, apiClient: ApiClient): Promise<void> {
    if (!(await isAuthenticated(state, apiClient))) {
        throw new Error("Not authenticated");
    }
}

export async function isAuthenticated(state: State, apiClient: ApiClient): Promise<boolean> {
    switch (state.auth.status) {
        case "not_auth":
            return false;
        case "requested":
            try {
                if (!state.auth.code) {
                    return false;
                }
                await apiClient.retrieveToken(state.auth.code.device_code);
                return !!state.auth.token;
            } catch {
                return false;
            }
        case "issued":
            if (!state.auth.token) {
                return false;
            }
            return await apiClient.validateToken();
        default:
            throw new Error("Unknown authentication status");
    }
}
