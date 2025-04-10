import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";

import argv from "yargs-parser";

// If we decide to support non-string config options, we'll need to extend the mechanism for parsing
// env variables.
interface UserConfig extends Record<string, string> {
    apiBaseUrl: string;
    clientId: string;
    stateFile: string;
    projectId: string;
}

const cliConfig = argv(process.argv.slice(2)) as unknown as Partial<UserConfig>;

const defaults: UserConfig = {
    apiBaseUrl: "https://cloud.mongodb.com/",
    clientId: "0oabtxactgS3gHIR0297",
    stateFile: path.join(getLocalDataPath(), "state.json"),
    projectId: "",
};

const mergedUserConfig = mergeConfigs(defaults, getFileConfig(), getEnvConfig(), cliConfig);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageMetadata = fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8");
const packageJson = JSON.parse(packageMetadata);

const config = {
    ...mergedUserConfig,
    atlasApiVersion: `2025-03-12`,
    version: packageJson.version,
    userAgent: `AtlasMCP/${packageJson.version} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
    localDataPath: getLocalDataPath(),
};

export default config;

function getLocalDataPath(): string {
    if (process.platform === "win32") {
        const appData = process.env.APPDATA;
        const localAppData = process.env.LOCALAPPDATA ?? process.env.APPDATA;
        if (localAppData && appData) {
            return path.join(localAppData, "mongodb", "mongodb-mcp");
        }
    }

    return path.join(os.homedir(), ".mongodb", "mongodb-mcp");
}

// Gets the config supplied by the user as environment variables. The variable names
// are prefixed with `MDB_MCP_` and the keys match the UserConfig keys, but are converted
// to SNAKE_UPPER_CASE.
function getEnvConfig(): Partial<UserConfig> {
    const camelCaseToSNAKE_UPPER_CASE = (str: string): string => {
        return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
    };

    const result: Partial<UserConfig> = {};
    Object.keys(defaults).forEach((key) => {
        const envVarName = `MDB_MCP_${camelCaseToSNAKE_UPPER_CASE(key)}`;
        if (process.env[envVarName]) {
            result[key as keyof UserConfig] = process.env[envVarName];
        }
    });

    return result;
}

// Gets the config supplied by the user as a JSON file. The file is expected to be located in the local data path
// and named `config.json`.
function getFileConfig(): Partial<UserConfig> {
    const configPath = path.join(getLocalDataPath(), "config.json");

    try {
        const config = fs.readFileSync(configPath, "utf8");
        return JSON.parse(config);
    } catch {
        return {};
    }
}

// Merges several user-supplied configs into one. The precedence is from right to left where the last
// config in the `partialConfigs` array overrides the previous ones. The `defaults` config is used as a base.
function mergeConfigs(defaults: UserConfig, ...partialConfigs: Array<Partial<UserConfig>>): UserConfig {
    const mergedConfig: UserConfig = { ...defaults };
    for (const key of Object.keys(defaults)) {
        for (const partialConfig of partialConfigs) {
            if (partialConfig[key]) {
                mergedConfig[key] = partialConfig[key];
            }
        }
    }

    return mergedConfig;
}
