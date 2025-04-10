import sinon from "sinon";
import { runServer } from "./index.js";
import * as StdioModule from "@modelcontextprotocol/sdk/server/stdio.js";
import * as ServerModule from "./server.js";
import sinonChai from "sinon-chai";
import { expect, use } from "chai";

use(sinonChai);

describe("Server initialization", () => {
    let stdioStub: sinon.SinonStub;
    let serverConnectStub: sinon.SinonStub;
    let serverStub: sinon.SinonStub;

    beforeEach(() => {
        // Set up stubs
        stdioStub = sinon.stub(StdioModule, "StdioServerTransport");

        serverConnectStub = sinon.stub().resolves({});
        const serverInstance = { connect: serverConnectStub };
        serverStub = sinon.stub(ServerModule, "Server").returns(serverInstance);
    });

    afterEach(() => {
        // Restore all stubs
        sinon.restore();
    });

    it("should create a server instance", async () => {
        await runServer();
        expect(stdioStub).to.have.been.called;
        expect(serverStub).to.have.been.called;
        expect(serverConnectStub).to.have.been.called;
    });
});
