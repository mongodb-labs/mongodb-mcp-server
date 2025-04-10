import { describe, it } from "@jest/globals";
import { State } from "../../src/state";

describe("Server initialization", () => {
    it("should define a default state", async () => {
        const state = new State();

        expect(state.credentials).toEqual({
            auth: {
                status: "not_auth",
            },
        });
    });
});
