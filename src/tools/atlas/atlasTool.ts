import { ToolBase } from "../tool.js";
import { ApiClient } from "../../common/atlas/apiClient.js";
import { State } from "../../state.js";
import { ensureAuthenticated } from "../../common/atlas/auth.js";

export abstract class AtlasToolBase extends ToolBase {
    constructor(
        state: State,
        protected apiClient: ApiClient
    ) {
        super(state);
    }

    protected async ensureAuthenticated(): Promise<void> {
        await ensureAuthenticated(this.state, this.apiClient);
    }
}
