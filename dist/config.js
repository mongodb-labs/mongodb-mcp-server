import path from "path";
import fs from "fs";
const packageMetadata = fs.readFileSync(path.resolve("./package.json"), "utf8");
const packageJson = JSON.parse(packageMetadata);
export const config = {
    version: packageJson.version,
    apiBaseURL: process.env.API_BASE_URL || "https://cloud.mongodb.com/",
    clientID: process.env.CLIENT_ID || "0oabtxactgS3gHIR0297",
    stateFile: process.env.STATE_FILE || path.resolve("./state.json"),
    projectID: process.env.PROJECT_ID,
    userAgent: `AtlasMCP/${packageJson.version} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
};
export default config;
