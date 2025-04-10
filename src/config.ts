import path from "path";
import os from "os";
import argv from "yargs-parser";

import packageJson from "../package.json" with { type: "json" };
import fs from "fs";
const { localDataPath, configPath } = getLocalDataPath();

// If we decide to support non-string config options, we'll need to extend the mechanism for parsing
// env variables.
interface UserConfig extends Record<string, string> {
    apiBaseUrl: string;
    clientId: string;
    stateFile: string;
}

const defaults: UserConfig = {
    apiBaseUrl: "https://cloud.mongodb.com/",
    clientId: "0oabtxactgS3gHIR0297",
    stateFile: path.join(localDataPath, "state.json"),
};

const mergedUserConfig = {
    ...defaults,
    ...getFileConfig(),
    ...getEnvConfig(),
    ...getCliConfig(),
};

const config = {
    ...mergedUserConfig,
    atlasApiVersion: `2025-03-12`,
    version: packageJson.version,
    userAgent: `AtlasMCP/${packageJson.version} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
    localDataPath,
};

export default config;

function getLocalDataPath(): { localDataPath: string; configPath: string } {
    let localDataPath: string | undefined;
    let configPath: string | undefined;

    if (process.platform === "win32") {
        const appData = process.env.APPDATA;
        const localAppData = process.env.LOCALAPPDATA ?? process.env.APPDATA;
        if (localAppData && appData) {
            localDataPath = path.join(localAppData, "mongodb", "mongodb-mcp");
            configPath = path.join(localDataPath, "mongodb-mcp.conf");
        }
    }

    localDataPath ??= path.join(os.homedir(), ".mongodb", "mongodb-mcp");
    configPath ??= "/etc/mongodb-mcp.conf";

    fs.mkdirSync(localDataPath, { recursive: true });

    return {
        localDataPath,
        configPath,
    };
}

// Gets the config supplied by the user as environment variables. The variable names
// are prefixed with `MDB_MCP_` and the keys match the UserConfig keys, but are converted
// to SNAKE_UPPER_CASE.
function getEnvConfig(): Partial<UserConfig> {
    const camelCaseToSNAKE_UPPER_CASE = (str: string): string => {
        return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
    };

    const result: Partial<UserConfig> = {};
    for (const key of Object.keys(defaults)) {
        const envVarName = `MDB_MCP_${camelCaseToSNAKE_UPPER_CASE(key)}`;
        if (process.env[envVarName]) {
            result[key] = process.env[envVarName];
        }
    }

    return result;
}

// Gets the config supplied by the user as a JSON file. The file is expected to be located in the local data path
// and named `config.json`.
function getFileConfig(): Partial<UserConfig> {
    try {
        const config = fs.readFileSync(configPath, "utf8");
        return JSON.parse(config);
    } catch {
        return {};
    }
}

// Reads the cli args and parses them into a UserConfig object.
function getCliConfig() {
    return argv(process.argv.slice(2)) as unknown as Partial<UserConfig>;
}
