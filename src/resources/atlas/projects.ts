import { ensureAuthenticated } from "../../common/atlas/auth.js";
import { ResourceUriBase } from "../base.js";

export class ProjectsResource extends ResourceUriBase {
    name = "projects";
    metadata = {
        description: "MongoDB Atlas projects"
    };
    uri = "atlas://projects";

    async execute(uri: URL) {
        await ensureAuthenticated(this.state, this.apiClient);

        const projects = await this.apiClient.listProjects();

        if (!projects) {
            return {
                contents: [],
            };
        }

        const projectList = projects.results.map((project) => ({
            id: project.id,
            name: project.name,
        }));

        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(projectList),
                },
            ],
        };
    }
};
