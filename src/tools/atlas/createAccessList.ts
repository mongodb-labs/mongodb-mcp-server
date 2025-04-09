import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AtlasToolBase } from "./atlasTool.js";
import { ToolArgs } from "../tool.js";

const DEFAULT_COMMENT = "Added by Atlas MCP";

export class CreateAccessListTool extends AtlasToolBase {
    protected name = "atlas-create-access-list";
    protected description = "Allow Ip/CIDR ranges to access your MongoDB Atlas clusters.";
    protected argsShape = {
        projectId: z.string().describe("Atlas project ID"),
        ipAddresses: z
            .array(z.string().ip({ version: "v4" }))
            .describe("IP addresses to allow access from")
            .optional(),
        cidrBlocks: z.array(z.string().cidr()).describe("CIDR blocks to allow access from").optional(),
        comment: z.string().describe("Comment for the access list entries").default(DEFAULT_COMMENT).optional(),
    };

    protected async execute({
        projectId,
        ipAddresses,
        cidrBlocks,
        comment,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        await this.ensureAuthenticated();

        if (!ipAddresses?.length && !cidrBlocks?.length) {
            throw new Error("Either ipAddresses or cidrBlocks must be provided.");
        }

        const ipInputs = (ipAddresses || []).map((ipAddress) => ({
            groupId: projectId,
            ipAddress,
            comment: comment || DEFAULT_COMMENT,
        }));

        const cidrInputs = (cidrBlocks || []).map((cidrBlock) => ({
            groupId: projectId,
            cidrBlock,
            comment: comment || DEFAULT_COMMENT,
        }));

        const inputs = [...ipInputs, ...cidrInputs];

        await this.apiClient.createProjectIpAccessList(projectId, inputs);

        return {
            content: [
                {
                    type: "text",
                    text: `IP/CIDR ranges added to access list for project ${projectId}.`,
                },
            ],
        };
    }
}
