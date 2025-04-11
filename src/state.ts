import { NodeDriverServiceProvider } from "@mongosh/service-provider-node-driver";

export class State {
    serviceProvider?: NodeDriverServiceProvider;
}

const defaultState = new State();
export default defaultState;
