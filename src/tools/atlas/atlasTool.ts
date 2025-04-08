import { ZodRawShape } from "zod";
import { ToolBase } from "../tool.js";
import { ApiClient } from "../../client.js";
import { State } from "../../state.js";

export abstract class AtlasToolBase<Args extends ZodRawShape = ZodRawShape> extends ToolBase<Args> {
    constructor(
        state: State,
        protected apiClient: ApiClient
    ) {
        super(state);
    }
}
