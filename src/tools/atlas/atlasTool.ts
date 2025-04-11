import { ToolBase, ToolCategory } from "../tool.js";
import { State } from "../../state.js";

export abstract class AtlasToolBase extends ToolBase {
    constructor(state: State) {
        super(state);
    }

    protected category: ToolCategory = "atlas";
}
