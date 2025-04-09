import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageMetadata = fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8");
const packageJson = JSON.parse(packageMetadata);

export const config = {
    version: packageJson.version,
    apiBaseURL: process.env.API_BASE_URL || "https://cloud.mongodb.com/",
    clientID: process.env.CLIENT_ID || "0oabtxactgS3gHIR0297",
    stateFile: process.env.STATE_FILE || path.resolve("./state.json"),
    projectID: process.env.PROJECT_ID,
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
