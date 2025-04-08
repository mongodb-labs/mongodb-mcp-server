import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClient } from '../client';
import { State } from '../state';
import { ProjectsResource } from './atlas/projects.js';
import { ClustersResource } from './atlas/clusters.js';

export function registerResources(server: McpServer, state: State, apiClient: ApiClient) {
    const projectsResource = new ProjectsResource(state, apiClient);
    const clustersResource = new ClustersResource(state, apiClient);

    projectsResource.register(server);
    clustersResource.register(server);
}

