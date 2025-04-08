import { ToolBase } from "../tool.js";
import { ApiClient } from "../../client.js";
import { State } from "../../state.js";

export abstract class AtlasToolBase extends ToolBase {
    constructor(
        state: State,
        protected apiClient: ApiClient
    ) {
        super(state);
    }
}
