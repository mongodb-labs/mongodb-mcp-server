import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClient } from '../client';
import { State } from '../state';
import { AuthTool } from '../tools/atlas/auth.js';

export function registerTools(server: McpServer, state: State, apiClient: ApiClient) {
    // atlas
    const authTool = new AuthTool(state, apiClient);
    authTool.register(server);
    
    // mongodb
    // TODO HERE
}

