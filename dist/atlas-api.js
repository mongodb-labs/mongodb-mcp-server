import { getToken } from "./auth.js";
import { log } from "./index.js";
// Base URL for Atlas API
const BASE_URL = "https://cloud.mongodb.com/api/atlas/v2";
// Get project ID from environment variables or use a default value
export const getProjectId = () => {
    return process.env.ATLAS_PROJECT_ID || "";
};
/**
 * Call the Atlas API with proper authentication
 * @param endpoint - API endpoint (e.g., "/groups")
 * @param method - HTTP method (default: 'GET')
 * @param body - Optional request body
 * @returns Promise with the API response data
 */
export async function callAtlasAPI(endpoint, method = 'GET', body) {
    const tokenData = await getToken();
    if (!tokenData || !tokenData.access_token) {
        throw new Error("Not authenticated. Please run the auth tool first.");
    }
    const token = tokenData.access_token;
    const url = `${BASE_URL}${endpoint}`;
    try {
        log("info", `Calling Atlas API: ${method} ${url}`);
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.atlas.2025-04-07+json',
                credentials: 'include',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errorText = await response.text();
            log("error", `Atlas API Error (${response.status}): ${errorText}`);
            throw new Error(`Atlas API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return await response.json();
    }
    catch (error) {
        log("error", `Error calling Atlas API: ${error}`);
        throw error;
    }
}
/**
 * Get all projects for the authenticated user
 */
export async function getProjects() {
    const response = await callAtlasAPI('/groups');
    return response;
}
/**
 * Get a specific project by ID
 */
export async function getProject(projectId) {
    return await callAtlasAPI(`/groups/${projectId}`);
}
/**
 * Get clusters for a specific project
 */
export async function getProjectClusters(projectId) {
    return await callAtlasAPI(`/groups/${projectId}/clusters`);
}
/**
 * Get all clusters across all accessible projects
 */
export async function getAllClusters() {
    const projectsResponse = await getProjects();
    const projects = projectsResponse.results || [];
    if (projects.length === 0) {
        return { results: [] };
    }
    const allClusters = [];
    for (const project of projects) {
        try {
            const clustersResponse = await getProjectClusters(project.id);
            // Enrich cluster data with project information
            const projectClusters = (clustersResponse.results || []).map((cluster) => ({
                ...cluster,
                projectId: project.id,
                projectName: project.name
            }));
            allClusters.push(...projectClusters);
        }
        catch (error) {
            log("error", `Error fetching clusters for project ${project.id}: ${error}`);
            // Continue with other projects even if one fails
        }
    }
    return { results: allClusters };
}
/**
 * Format clusters into a readable table format
 */
export function formatClustersTable(clusters) {
    if (clusters.length === 0) {
        return "No clusters found.";
    }
    const header = `Project | Cluster Name | State | MongoDB Version | Region | Connection String
----------------|----------------|----------------|----------------|----------------|----------------`;
    const rows = clusters.map(cluster => {
        const region = cluster.providerSettings?.regionName || 'N/A';
        const connectionString = cluster.connectionStrings?.standard || 'N/A';
        const mongoDBVersion = cluster.mongoDBVersion || 'N/A';
        const projectName = cluster.projectName || 'Unknown Project';
        return `${projectName} | ${cluster.name} | ${cluster.stateName} | ${mongoDBVersion} | ${region} | ${connectionString}`;
    }).join("\n");
    return `${header}\n${rows}`;
}
