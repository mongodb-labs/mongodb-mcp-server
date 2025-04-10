import fs from "fs/promises";
import config from "./config.js";
import { OauthDeviceCode, OAuthToken } from "./common/atlas/apiClient.js";

export interface State {
    auth: {
        status: "not_auth" | "requested" | "issued";
        code?: OauthDeviceCode;
        token?: OAuthToken;
    };
    connectionString?: string;
}

export async function saveState(state: State): Promise<void> {
    await fs.writeFile(config.stateFile, JSON.stringify(state), { encoding: "utf-8" });
}

export async function loadState(): Promise<State> {
    try {
        const data = await fs.readFile(config.stateFile, "utf-8");
        return JSON.parse(data) as State;
    } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
            return {
                auth: {
                    status: "not_auth",
                },
            };
        }

        throw err;
    }
}
