import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";;
import { ResourceTemplateBase } from "../base.js";
import { ensureAuthenticated } from "../../common/atlas/auth.js";

export class ClustersResource extends ResourceTemplateBase {
    name = "clusters";
    metadata = {
        description: "MongoDB Atlas clusters"
    };
    template = new ResourceTemplate("atlas://clusters", { list: undefined });

    async execute(uri: URL, { projectId }: { projectId: string }) {
        await ensureAuthenticated(this.state, this.apiClient);

        const clusters = await this.apiClient.listProjectClusters(projectId);

        if (!clusters || clusters.results.length === 0) {
            return {
                contents: [],
            };
        }

        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(clusters.results),
                },
            ],
        };
    }
};
