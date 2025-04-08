import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { z, ZodOptional, ZodString } from "zod";
import { ApiClient, AtlasCluster } from "./client.js";
import { State, saveState, loadState } from "./state.js";
import { config } from "./config.js";

function log(level: string, message: string) {
    console.error(`[${level.toUpperCase()}] ${message}`);
}

export class Server {
    state: State | undefined = undefined;
    apiClient: ApiClient | undefined = undefined;
    initiated: boolean = false;

    private async init() {
        if (this.initiated) {
            return;
        }
        this.state = await loadState();

        this.apiClient = new ApiClient({
            token: this.state?.auth.token,
            saveToken: (token) => {
                if (!this.state) {
                    throw new Error("State is not initialized");
                }
                this.state.auth.code = undefined;
                this.state.auth.token = token;
                this.state.auth.status = "issued";
                saveState(this.state);
            },
        });

        this.initiated = true;
    }

    private async ensureAuthenticated() {
        switch (this.state!.auth.status) {
            case "not_auth":
                return false;
            case "requested":
                try {
                    if (!this.state!.auth.code) {
                        return false;
                    }
                    await this.apiClient!.retrieveToken(this.state!.auth.code.device_code);
                    return !!this.state!.auth.token;
                } catch {
                    return false;
                }
            case "issued":
                if (!this.state!.auth.token) {
                    return false;
                }
                return await this.apiClient!.validateToken();
            default:
                throw new Error("Unknown authentication status");
        }
    }

    private async authTool(): Promise<CallToolResult> {
        const auth = await this.ensureAuthenticated();
        if (auth) {
            log("INFO", "Already authenticated!");
            return {
                content: [{ type: "text", text: "You are already authenticated!" }],
            };
        }

        try {
            const code = await this.apiClient!.authenticate();

            this.state!.auth.status = "requested";
            this.state!.auth.code = code;
            this.state!.auth.token = undefined;

            await saveState(this.state!);

            return {
                content: [
                    {
                        type: "text",
                        text: `Please authenticate by visiting ${code.verification_uri} and entering the code ${code.user_code}`,
                    },
                ],
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                log("error", `Authentication error: ${error}`);
                return {
                    content: [{ type: "text", text: `Authentication failed: ${error.message}` }],
                };
            } else {
                log("error", `Unknown authentication error: ${error}`);
                return {
                    content: [{ type: "text", text: "Authentication failed due to an unknown error." }],
                };
            }
        }
    }
    private async listClustersTool(projectId?: string): Promise<CallToolResult> {
        try {
            // Ensure user is authenticated or throw an error
            const auth = await this.ensureAuthenticated();
            if (!auth) {
                return {
                    content: [{ type: "text", text: "You need to be authenticated first" }],
                };
            }

            let clusters: AtlasCluster[] | undefined = undefined;
            let introText = "Here are your MongoDB Atlas clusters:";

            const selectedProjectId = projectId || config.projectID;
            if (!selectedProjectId) {
                return {
                    content: [{ type: "text", text: "No project ID provided. Please specify a project ID." }],
                };
            }
            const project = await this.apiClient!.getProject(selectedProjectId);

            const data = await this.apiClient!.listProjectClusters(project.id);
            clusters = data.results || [];

            try {
                introText = `Here are the clusters in project "${project.name}" (${project.id}):`;
            } catch (e) {
                log("error", `Error fetching project details: ${e}`);
            }

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

            const formattedClusters = formatClustersTable(clusters);

            return {
                content: [
                    { type: "text", text: introText },
                    { type: "text", text: formattedClusters },
                ],
            };
        } catch (error) {
            log("error", `Error listing clusters: ${error}`);

            // If the error is authentication related, suggest using auth tool
            if (error instanceof Error && error.message.includes("Not authenticated")) {
                return {
                    content: [
                        { type: "text", text: "You need to authenticate before listing clusters." },
                        { type: "text", text: "Please use the 'auth' tool to log in to your MongoDB Atlas account." },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `Error listing clusters: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    private async listProjectsTool(): Promise<CallToolResult> {
        try {
            // Ensure user is authenticated or throw an error
            const auth = await this.ensureAuthenticated();
            if (!auth) {
                return {
                    content: [{ type: "text", text: "You need to be authenticated first" }],
                };
            }

            const projectsData = await this.apiClient!.listProjects();
            const projects = projectsData.results || [];

            if (!projects || projects.length === 0) {
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
        } catch (error) {
            log("error", `Error listing projects: ${error}`);

            // If the error is authentication related, suggest using auth tool
            if (error instanceof Error && error.message.includes("Not authenticated")) {
                return {
                    content: [
                        { type: "text", text: "You need to authenticate before listing projects." },
                        { type: "text", text: "Please use the 'auth' tool to log in to your MongoDB Atlas account." },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `Error listing projects: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }

    private createMcpServer(): McpServer {
        const server = new McpServer({
            name: "MongoDB Atlas",
            version: config.version,
        });

        server.tool("auth", "Authenticate to Atlas", async () => this.authTool());

        let projectIdFilter: ZodString | ZodOptional<ZodString> = z
            .string()
            .describe("Optional Atlas project ID to filter clusters");
        if (config.projectID) {
            projectIdFilter = projectIdFilter.optional();
        }

        server.tool(
            "list-clusters",
            "Lists MongoDB Atlas clusters",
            {
                projectId: projectIdFilter,
            },
            async ({ projectId }: { projectId?: string }) => this.listClustersTool(projectId)
        );
        server.tool("list-projects", "Lists MongoDB Atlas projects", async () => this.listProjectsTool());

        return server;
    }

    async connect(transport: Transport) {
        await this.init();
        const server = this.createMcpServer();
        await server.connect(transport);
    }
}

function formatClustersTable(clusters: AtlasCluster[]): string {
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
