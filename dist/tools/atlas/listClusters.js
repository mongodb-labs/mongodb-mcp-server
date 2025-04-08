import { z } from "zod";
import { config } from "../../config.js";
import { ensureAuthenticated } from "./auth.js";
import { AtlasToolBase } from "./atlasTool.js";
export class ListClustersTool extends AtlasToolBase {
    constructor(apiClient) {
        super(apiClient);
        this.name = "listClusters";
        this.description = "List MongoDB Atlas clusters";
        let projectIdFilter = z.string().describe("Optional Atlas project ID to filter clusters");
        if (config.projectID) {
            projectIdFilter = projectIdFilter.optional();
        }
        this.argsShape = {
            projectId: projectIdFilter,
        };
    }
    async execute({ projectId }) {
        await ensureAuthenticated(this.state, this.apiClient);
        let clusters = undefined;
        let introText = "Here are your MongoDB Atlas clusters:";
        const selectedProjectId = projectId || config.projectID;
        if (!selectedProjectId) {
            return {
                content: [{ type: "text", text: "No project ID provided. Please specify a project ID." }],
            };
        }
        const project = await this.apiClient.getProject(selectedProjectId);
        const data = await this.apiClient.listProjectClusters(project.id);
        clusters = data.results || [];
        introText = `Here are the clusters in project "${project.name}" (${project.id}):`;
        if (clusters.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No clusters found. You may need to create a cluster in your MongoDB Atlas account.",
                    },
                ],
            };
        }
        const formattedClusters = this.formatClustersTable(clusters);
        return {
            content: [
                { type: "text", text: introText },
                { type: "text", text: formattedClusters },
            ],
        };
    }
    formatClustersTable(clusters) {
        if (clusters.length === 0) {
            return "No clusters found.";
        }
        const header = `Cluster Name | State | MongoDB Version | Region | Connection String
    ----------------|----------------|----------------|----------------|----------------|----------------`;
        const rows = clusters
            .map((cluster) => {
            const region = cluster.providerSettings?.regionName || "N/A";
            const connectionString = cluster.connectionStrings?.standard || "N/A";
            const mongoDBVersion = cluster.mongoDBVersion || "N/A";
            return `${cluster.name} | ${cluster.stateName} | ${mongoDBVersion} | ${region} | ${connectionString}`;
        })
            .join("\n");
        return `${header}\n${rows}`;
    }
}
//# sourceMappingURL=listClusters.js.map