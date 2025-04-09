import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AtlasToolBase } from "./atlasTool.js";
import { ToolArgs } from "../tool.js";
import { ClusterDescription20240805 } from "../../common/atlas/openapi.js";

export class InspectClusterTool extends AtlasToolBase {
    protected name = "atlas-inspect-cluster";
    protected description = "Inspect MongoDB Atlas cluster";
    protected argsShape = {
        projectId: z.string().describe("Atlas project ID"),
        clusterName: z.string().describe("Atlas cluster name"),
    };

    protected async execute({ projectId, clusterName }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        await this.ensureAuthenticated();

        const cluster = await this.apiClient.getCluster(projectId, clusterName);

        return this.formatOutput(cluster);
    }

    private formatOutput(cluster: ClusterDescription20240805): CallToolResult {
        return {
            content: [
                {
                    type: "text",
                    text: `Cluster Name | State | MongoDB Version | Connection String
----------------|----------------|----------------|----------------|----------------
${cluster.name} | ${cluster.stateName} | ${cluster.mongoDBVersion || "N/A"} | ${cluster.connectionStrings?.standard || "N/A"}`,
                },
            ],
        };
    }
}
