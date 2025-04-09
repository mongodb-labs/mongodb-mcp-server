import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { log } from "../../logger.js";
import { saveState } from "../../state.js";
import { AtlasToolBase } from "./atlasTool.js";
import { isAuthenticated } from "../../common/atlas/auth.js";

export class AuthTool extends AtlasToolBase {
    protected name = "atlas-auth";
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
