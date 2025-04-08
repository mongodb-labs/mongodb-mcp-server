import { log } from "../logger.js";
export class ToolBase {
    constructor() {
        this.state = undefined; // We should never use this before it's set
    }
    register(server, state) {
        this.state = state;
        const callback = async (args) => {
            try {
                // TODO: add telemetry here
                return await this.execute(args);
            }
            catch (error) {
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
            server.tool(this.name, this.description, this.argsShape, callback);
        }
        else {
            server.tool(this.name, this.description, callback);
        }
    }
}
//# sourceMappingURL=tool.js.map