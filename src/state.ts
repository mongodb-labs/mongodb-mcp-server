import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";

export class State {
    serviceProvider?: NodeDriverServiceProvider;
    connectionString?: string;
}

const defaultState = new State();
export default defaultState;
