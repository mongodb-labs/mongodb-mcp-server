import { ensureAuthenticated } from "./auth.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AtlasToolBase } from "./atlasTool.js";

export class ListProjectsTool extends AtlasToolBase {
    protected name = "listProjects";
    protected description = "List MongoDB Atlas projects";
    protected argsShape = {};

    protected async execute(): Promise<CallToolResult> {
        await ensureAuthenticated(this.state, this.apiClient);

        const projectsData = await this.apiClient!.listProjects();
        const projects = projectsData.results || [];

        if (projects.length === 0) {
            return {
                content: [{ type: "text", text: "No projects found in your MongoDB Atlas account." }],
            };
        }

        // Format projects as a table
        const header = `Project Name | Project ID | Created At
----------------|----------------|----------------`;
        const rows = projects
            .map((project) => {
                const createdAt = project.created ? new Date(project.created.$date).toLocaleString() : "N/A";
                return `${project.name} | ${project.id} | ${createdAt}`;
            })
            .join("\n");
        const formattedProjects = `${header}\n${rows}`;
        return {
            content: [
                { type: "text", text: "Here are your MongoDB Atlas projects:" },
                { type: "text", text: formattedProjects },
            ],
        };
    }
}
