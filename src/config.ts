import path from "path";
import os from "os";
import packageJson from "../package.json" with { type: "json" };

export const config = {
    atlasApiVersion: `2025-03-12`,
    version: packageJson.version,
    apiBaseURL: process.env.API_BASE_URL || "https://cloud.mongodb.com/",
    clientID: process.env.CLIENT_ID || "0oabtxactgS3gHIR0297",
    stateFile: process.env.STATE_FILE || path.resolve("./state.json"),
    userAgent: `AtlasMCP/${packageJson.version} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
    localDataPath: getLocalDataPath(),
};

export default config;

function getLocalDataPath() {
    if (process.platform === "win32") {
        const appData = process.env.APPDATA;
        const localAppData = process.env.LOCALAPPDATA ?? process.env.APPDATA;
        if (localAppData && appData) {
            return path.join(localAppData, "mongodb", "mongodb-mcp");
        }
    }

    return path.join(os.homedir(), ".mongodb", "mongodb-mcp");
}
