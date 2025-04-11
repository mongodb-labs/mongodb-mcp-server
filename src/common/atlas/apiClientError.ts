export class ApiClientError extends Error {
    response?: Response;

    constructor(message: string, response: Response | undefined = undefined) {
        super(message);
        this.name = "ApiClientError";
        this.response = response;
    }

    static async fromResponse(
        response: Response,
        message: string = `error calling Atlas API`
    ): Promise<ApiClientError> {
        try {
            const text = await response.text();
            return new ApiClientError(`${message}: [${response.status} ${response.statusText}] ${text}`, response);
        } catch {
            return new ApiClientError(`${message}: ${response.status} ${response.statusText}`, response);
        }
    }
}
