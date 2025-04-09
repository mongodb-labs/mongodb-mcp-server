export enum ErrorCodes {
    NotConnectedToMongoDB = 1_000_000,
    InvalidParams = 1_000_001,
}

export class MongoDBError extends Error {
    constructor(
        public code: ErrorCodes,
        message: string
    ) {
        super(message);
    }
}
