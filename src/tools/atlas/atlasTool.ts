import { ToolBase } from "../tool.js";
import { ApiClient } from "../../common/atlas/apiClient.js";
import { Session } from "../../session.js";

export abstract class AtlasToolBase extends ToolBase {

    constructor(protected readonly session: Session) {
        super(session);
    }
}
