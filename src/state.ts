import { OauthDeviceCode, OAuthToken } from "./common/atlas/apiClient.js";
import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";
import { AsyncEntry } from "@napi-rs/keyring";
import logger from "./logger.js";
import { mongoLogId } from "mongodb-log-writer";

const entry = new AsyncEntry("mongodb-mcp", "credentials");

export interface State {
    persistent: {
        auth: {
            status: "not_auth" | "requested" | "issued";
            code?: OauthDeviceCode;
            token?: OAuthToken;
        };
        connectionString?: string;
    };
    session: {
        serviceProvider?: NodeDriverServiceProvider;
    };
}

const defaultState: State = {
    persistent: {
        auth: {
            status: "not_auth",
        },
    },
    session: {},
};

export async function saveState(state: State): Promise<void> {
    await entry.setPassword(JSON.stringify(state.persistent));
}

export async function loadState(): Promise<State> {
    try {
        const data = await entry.getPassword();
        if (!data) {
            return defaultState;
        }

        return {
            persistent: JSON.parse(data),
            session: {},
        };
    } catch (err: unknown) {
        logger.error(mongoLogId(1_000_007), "state", `Failed to load state: ${err}`);
        return defaultState;
    }
}
