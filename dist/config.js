import path from "path";
export const config = {
    version: process.env.VERSION || "1.0.0",
    apiBaseURL: process.env.API_BASE_URL || "https://cloud.mongodb.com/",
    clientID: process.env.CLIENT_ID || "0oabtxactgS3gHIR0297",
    stateFile: process.env.STATE_FILE || path.resolve("./state.json"),
    projectID: process.env.PROJECT_ID,
};
export default config;
