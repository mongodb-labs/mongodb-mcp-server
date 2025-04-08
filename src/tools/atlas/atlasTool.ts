import { ZodRawShape } from "zod";
import { ToolBase } from "../tool.js";
import { ApiClient } from "../../client.js";

export abstract class AtlasToolBase<Args extends ZodRawShape> extends ToolBase<Args> {
    constructor(protected apiClient: ApiClient) {
        super();
    }
}
