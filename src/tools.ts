import { z } from "zod";
import { pollToken, authenticate, isAuthenticated } from "./auth.js";
import { getAllClusters, getProjectClusters, getProjects, formatClustersTable, getProjectId, getProject } from "./atlas-api.js";
import { GlobalState, log } from "./index.js";

// Helper function to ensure authentication
async function ensureAuthenticated() {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
        return true;
    }
    
    throw new Error("Not authenticated. Please authenticate with the 'auth' tool first.");
}

export function defineTools(server: any, globalState: GlobalState) {
    server.tool("auth", "Authenticate to Atlas", async ({}) => {
        const authResult = await isAuthenticated();
        if (authResult) {
            log("info", "Already authenticated!");
            return {
                content: [{ type: "text", text: "You are already authenticated!" }],
            };
        }

        try {
            const { verificationUri, userCode } = await authenticate();

            // Inform the user to authenticate
            const initialResponse = {
                content: [
                    { type: "text", text: `Please authenticate by visiting ${verificationUri} and entering the code ${userCode}` },
                    { type: "text", text: "Polling for token..." }
                ] as Array<{ type: "text"; text: string }>,
            };

            // Start polling for the token asynchronously
            pollToken().then(_ => {
                globalState.auth = true;
                log("info", "Authentication successful!");
            }).catch(error => {
                log("error", `Token polling failed: ${error}`);
            });

            return initialResponse;
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
    });

    server.tool(
        "list-clusters", 
        "Lists MongoDB Atlas clusters", 
        {
            projectId: z.string().optional().describe("Optional Atlas project ID to filter clusters")
        },
        async ({ projectId }: { projectId?: string }) => {
            try {
                // Ensure user is authenticated or throw an error
                await ensureAuthenticated();
                
                let clustersData;
                let introText = "Here are your MongoDB Atlas clusters:";
                
                // If projectId is provided, only get clusters from that project
                if (projectId) {
                    clustersData = await getProjectClusters(projectId);
                    try {
                        const project = await getProject(projectId);
                        introText = `Here are the clusters in project "${project.name}" (${projectId}):`;
                    } catch (e) {
                        log("error", `Error fetching project details: ${e}`);
                    }
                } else {
                    // Use env variable if set
                    const envProjectId = getProjectId();
                    if (envProjectId) {
                        clustersData = await getProjectClusters(envProjectId);
                        try {
                            const project = await getProject(envProjectId);
                            introText = `Here are the clusters in your default project "${project.name}" (${envProjectId}):`;
                        } catch (e) {
                            log("error", `Error fetching project details: ${e}`);
                        }
                    } else {
                        // Otherwise get from all projects
                        clustersData = await getAllClusters();
                        introText = "Here are all your MongoDB Atlas clusters:";
                    }
                }
                
                const clusters = clustersData.results || [];
                
                if (clusters.length === 0) {
                    return {
                        content: [{ 
                            type: "text", 
                            text: "No clusters found. You may need to create a cluster in your MongoDB Atlas account."
                        }],
                    };
                }
                
                const formattedClusters = formatClustersTable(clusters);
                
                return {
                    content: [
                        { type: "text", text: introText },
                        { type: "text", text: formattedClusters }
                    ],
                };
            } catch (error) {
                log("error", `Error listing clusters: ${error}`);
                
                // If the error is authentication related, suggest using auth tool
                if (error instanceof Error && error.message.includes("Not authenticated")) {
                    return {
                        content: [
                            { type: "text", text: "You need to authenticate before listing clusters." },
                            { type: "text", text: "Please use the 'auth' tool to log in to your MongoDB Atlas account." }
                        ],
                    };
                }
                
                return {
                    content: [{ 
                        type: "text", 
                        text: `Error listing clusters: ${error instanceof Error ? error.message : String(error)}`
                    }],
                };
            }
        }
    );

    server.tool(
        "list-projects", 
        "Lists MongoDB Atlas projects",
        async () => {
            try {
                // Ensure user is authenticated or throw an error
                await ensureAuthenticated();
                
                const projectsData = await getProjects();
                const projects = projectsData.results || [];
                
                if (!projects || projects.length === 0) {
                    return {
                        content: [{ type: "text", text: "No projects found in your MongoDB Atlas account." }],
                    };
                }
                
                // Format projects as a table
                const header = `Project Name | Project ID | Created At
----------------|----------------|----------------`;
                
                const rows = projects.map((project: any) => {
                    const createdAt = project.created ? new Date(project.created.$date).toLocaleString() : 'N/A';
                    return `${project.name} | ${project.id} | ${createdAt}`;
                }).join("\n");
                
                const formattedProjects = `${header}\n${rows}`;
                
                return {
                    content: [
                        { type: "text", text: "Here are your MongoDB Atlas projects:" },
                        { type: "text", text: formattedProjects }
                    ],
                };
            } catch (error) {
                log("error", `Error listing projects: ${error}`);
                
                // If the error is authentication related, suggest using auth tool
                if (error instanceof Error && error.message.includes("Not authenticated")) {
                    return {
                        content: [
                            { type: "text", text: "You need to authenticate before listing projects." },
                            { type: "text", text: "Please use the 'auth' tool to log in to your MongoDB Atlas account." }
                        ],
                    };
                }
                
                return {
                    content: [{ 
                        type: "text", 
                        text: `Error listing projects: ${error instanceof Error ? error.message : String(error)}`
                    }],
                };
            }
        }
    );
}