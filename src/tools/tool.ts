import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodNever, ZodRawShape } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { State } from "../state.js";
import logger from "../logger.js";
import { mongoLogId } from "mongodb-log-writer";

export type ToolArgs<Args extends ZodRawShape> = z.objectOutputType<Args, ZodNever>;

export abstract class ToolBase {
    protected abstract name: string;

    protected abstract description: string;

    protected abstract argsShape: ZodRawShape;

    protected abstract execute(args: ToolArgs<typeof this.argsShape>): Promise<CallToolResult>;

    protected constructor(protected state: State) {}

    public register(server: McpServer): void {
        const callback = async (args: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> => {
            try {
                // TODO: add telemetry here
                logger.debug(
                    mongoLogId(1_000_006),
                    "tool",
                    `Executing ${this.name} with args: ${JSON.stringify(args)}`
                );

                return await this.execute(args);
            } catch (error) {
                logger.error(mongoLogId(1_000_000), "tool", `Error executing ${this.name}: ${error}`);

                return await this.handleError(error);
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

    // This method is intended to be overridden by subclasses to handle errors
    protected handleError(error: unknown): Promise<CallToolResult> | CallToolResult {
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
}
