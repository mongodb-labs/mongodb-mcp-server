import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AtlasToolBase } from "./atlasTool.js";
import { ToolArgs } from "../tool.js";

export class InspectAccessListTool extends AtlasToolBase {
    protected name = "atlas-inspect-access-list";
    protected description = "Inspect Ip/CIDR ranges with access to your MongoDB Atlas clusters.";
    protected argsShape = {
        projectId: z.string().describe("Atlas project ID"),
    };

    protected async execute({ projectId }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        await this.ensureAuthenticated();

        const accessList = await this.apiClient.listProjectIpAccessLists({
            params: {
                path: {
                    groupId: projectId,
                },
            },
        });

        if (!accessList?.results?.length) {
            throw new Error("No access list entries found.");
        }

        return {
            content: [
                {
                    type: "text",
                    text: `IP ADDRESS | CIDR | COMMENT
------|------|------
${(accessList.results || [])
    .map((entry) => {
        return `${entry.ipAddress} | ${entry.cidrBlock} | ${entry.comment}`;
    })
    .join("\n")}`,
                },
            ],
        };
    }
}
