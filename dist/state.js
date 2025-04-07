import fs from "fs";
import config from "./config.js";
export async function saveState(state) {
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
    return new Promise((resolve, reject) => {
        fs.readFile(config.stateFile, "utf-8", (err, data) => {
            if (err) {
                if (err.code === "ENOENT") {
                    // File does not exist, return default state
                    const defaultState = {
                        auth: {
                            status: "not_auth",
                        },
                    };
                    return resolve(defaultState);
                }
                else {
                    return reject(err);
                }
            }
            return resolve(JSON.parse(data));
        });
    });
}
