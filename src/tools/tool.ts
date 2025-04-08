import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape, ZodTypeAny } from "zod";
import { log } from "../logger.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { State } from "../state.js";

export abstract class ToolBase<Args extends ZodRawShape> {
    protected abstract name: string;

    protected abstract description: string;

    protected abstract argsShape: Args;

    protected abstract execute(args: z.objectOutputType<Args, ZodTypeAny>): Promise<CallToolResult>;

    protected constructor(protected state: State) {}

    public register(server: McpServer): void {
        const callback = async (args: z.objectOutputType<Args, ZodTypeAny>): Promise<CallToolResult> => {
            try {
                // TODO: add telemetry here

                return await this.execute(args);
            } catch (error) {
                log("error", `Error executing ${this.name}: ${error}`);

                // If the error is authentication related, suggest using auth tool
                if (error instanceof Error && error.message.includes("Not authenticated")) {
                    return {
                        content: [
                            { type: "text", text: "You need to authenticate before accessing Atlas data." },
                            {
                                type: "text",
                                text: "Please use the 'auth' tool to log in to your MongoDB Atlas account.",
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `Error running ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        };

        if (this.argsShape) {
            // Not sure why typescript doesn't like the type signature of callback.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            server.tool(this.name, this.description, this.argsShape, callback as any);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            server.tool(this.name, this.description, callback as any);
        }
    }
}
