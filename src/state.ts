import fs from "fs";
import config from "./config.js";
import { OauthDeviceCode, OAuthToken } from "./client.js";

export interface State {
    auth: {
        status: "not_auth" | "requested" | "issued";
        code?: OauthDeviceCode;
        token?: OAuthToken;
    }
}


export async function saveState(state: State): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(config.stateFile, JSON.stringify(state), function (err) {
            if (err) {
                return reject(err);
            }
            
            return resolve();
        });
    });
}

export async function loadState() {
    return new Promise<State>((resolve, reject) => {
        fs.readFile(config.stateFile, "utf-8", (err, data) => {
            if (err) {
                if (err.code === "ENOENT") {
                    // File does not exist, return default state
                    const defaultState: State = {
                        auth: {
                            status: "not_auth",
                        },
                    };
                    return resolve(defaultState);
                } else {
                    return reject(err);
                }
            }
            return resolve(JSON.parse(data) as State);
        });
    });
}
