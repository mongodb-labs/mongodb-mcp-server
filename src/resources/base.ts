import { McpServer, ResourceMetadata, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";;
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";;
import { State } from "../state.js";
import { ApiClient } from "../client.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";;
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";;

abstract class ResourceCommonBase {
    protected abstract name: string;
    protected abstract metadata?: ResourceMetadata;

    constructor(protected state: State, protected apiClient: ApiClient) { }
}

export abstract class ResourceUriBase extends ResourceCommonBase {
    protected abstract uri: string;

    abstract execute(uri: URL, extra: RequestHandlerExtra): ReadResourceResult | Promise<ReadResourceResult>;

    register(server: McpServer) {
        server.resource(
            this.name,
            this.uri,
            this.metadata || {},
            (uri: URL, extra: RequestHandlerExtra) => {
                return this.execute(uri, extra);
            }
        );
    }
}

export abstract class ResourceTemplateBase extends ResourceCommonBase {
    protected abstract template: ResourceTemplate;

    abstract execute(uri: URL, variables: Variables, extra: RequestHandlerExtra): ReadResourceResult | Promise<ReadResourceResult>;

    register(server: McpServer) {
        server.resource(
            this.name,
            this.template,
            this.metadata || {},
            (uri: URL, variables: Variables, extra: RequestHandlerExtra) => {
                return this.execute(uri, variables, extra);
            }
        );
    }
}

export type ResourceBase = ResourceTemplateBase | ResourceUriBase;
