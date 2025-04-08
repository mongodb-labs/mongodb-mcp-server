import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiClient } from "../../client.js";
import { log } from "../../logger.js";
import { saveState } from "../../state.js";
import { State } from "../../state.js";
import { AtlasToolBase } from "./atlasTool.js";

export async function ensureAuthenticated(state: State, apiClient: ApiClient): Promise<void> {
    if (!(await isAuthenticated(state, apiClient))) {
        throw new Error("Not authenticated");
    }
}

export async function isAuthenticated(state: State, apiClient: ApiClient): Promise<boolean> {
    switch (state.auth.status) {
        case "not_auth":
            return false;
        case "requested":
            try {
                if (!state.auth.code) {
                    return false;
                }
                await apiClient.retrieveToken(state.auth.code.device_code);
                return !!state.auth.token;
            } catch {
                return false;
            }
        case "issued":
            if (!state.auth.token) {
                return false;
            }
            return await apiClient.validateToken();
        default:
            throw new Error("Unknown authentication status");
    }
}

export class AuthTool extends AtlasToolBase {
    protected name = "auth";
    protected description = "Authenticate to MongoDB Atlas";
    protected argsShape = {};

    private async isAuthenticated(): Promise<boolean> {
        return isAuthenticated(this.state!, this.apiClient);
    }

    async execute(): Promise<CallToolResult> {
        if (await this.isAuthenticated()) {
            log("INFO", "Already authenticated!");
            return {
                content: [{ type: "text", text: "You are already authenticated!" }],
            };
        }

        try {
            const code = await this.apiClient.authenticate();

            this.state!.auth.status = "requested";
            this.state!.auth.code = code;
            this.state!.auth.token = undefined;

            await saveState(this.state!);

            return {
                content: [
                    {
                        type: "text",
                        text: `Please authenticate by visiting ${code.verification_uri} and entering the code ${code.user_code}`,
                    },
                ],
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                log("error", `Authentication error: ${error}`);
                return {
                    content: [{ type: "text", text: `Authentication failed: ${error.message}` }],
                };
            }

            log("error", `Unknown authentication error: ${error}`);
            return {
                content: [{ type: "text", text: "Authentication failed due to an unknown error." }],
            };
        }
    }
}
