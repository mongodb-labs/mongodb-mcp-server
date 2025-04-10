import config from "../../config.js";
import createClient, { FetchOptions, Middleware } from "openapi-fetch";

import { paths, operations } from "./openapi.js";

export interface OAuthToken {
    access_token: string;
    refresh_token: string;
    scope: string;
    id_token: string;
    token_type: string;
    expires_in: number;
    expiry: Date;
}

export interface OauthDeviceCode {
    user_code: string;
    verification_uri: string;
    device_code: string;
    expires_in: string;
    interval: string;
}

export type saveTokenFunction = (token: OAuthToken) => void | Promise<void>;

export class ApiClientError extends Error {
    response?: Response;

    constructor(message: string, response: Response | undefined = undefined) {
        super(message);
        this.name = "ApiClientError";
        this.response = response;
    }

    static async fromResponse(response: Response, message?: string): Promise<ApiClientError> {
        message ||= `error calling Atlas API`;
        try {
            const text = await response.text();
            return new ApiClientError(`${message}: [${response.status} ${response.statusText}] ${text}`, response);
        } catch {
            return new ApiClientError(`${message}: ${response.status} ${response.statusText}`, response);
        }
    }
}

export interface ApiClientOptions {
    token?: OAuthToken;
    saveToken?: saveTokenFunction;
}

export class ApiClient {
    private token?: OAuthToken;
    private saveToken?: saveTokenFunction;
    private client = createClient<paths>({
        baseUrl: config.apiBaseUrl,
        headers: {
            "User-Agent": config.userAgent,
            Accept: `application/vnd.atlas.${config.atlasApiVersion}+json`,
        },
    });
    private authMiddleware = (apiClient: ApiClient): Middleware => ({
        async onRequest({ request, schemaPath }) {
            if (schemaPath.startsWith("/api/private/unauth") || schemaPath.startsWith("/api/oauth")) {
                return undefined;
            }
            if (await apiClient.validateToken()) {
                request.headers.set("Authorization", `Bearer ${apiClient.token!.access_token}`);
                return request;
            }
        },
    });
    private errorMiddleware = (): Middleware => ({
        async onResponse({ response }) {
            if (!response.ok) {
                throw await ApiClientError.fromResponse(response);
            }
        },
    });

    constructor(options: ApiClientOptions) {
        const { token, saveToken } = options;
        this.token = token;
        this.saveToken = saveToken;
        this.client.use(this.authMiddleware(this));
        this.client.use(this.errorMiddleware());
    }

    async storeToken(token: OAuthToken): Promise<OAuthToken> {
        this.token = token;

        if (this.saveToken) {
            await this.saveToken(token);
        }

        return token;
    }

    async authenticate(): Promise<OauthDeviceCode> {
        const endpoint = "api/private/unauth/account/device/authorize";

        const authUrl = new URL(endpoint, config.apiBaseUrl);

        const response = await fetch(authUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                scope: "openid profile offline_access",
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            }).toString(),
        });

        if (!response.ok) {
            throw await ApiClientError.fromResponse(response, `failed to initiate authentication`);
        }

        return (await response.json()) as OauthDeviceCode;
    }

    async retrieveToken(device_code: string): Promise<OAuthToken> {
        const endpoint = "api/private/unauth/account/device/token";
        const url = new URL(endpoint, config.apiBaseUrl);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                device_code: device_code,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            }).toString(),
        });

        if (response.ok) {
            const tokenData = await response.json();
            const buf = Buffer.from(tokenData.access_token.split(".")[1], "base64").toString();
            const jwt = JSON.parse(buf);
            const expiry = new Date(jwt.exp * 1000);
            return await this.storeToken({ ...tokenData, expiry });
        }
        try {
            const errorResponse = await response.json();
            if (errorResponse.errorCode === "DEVICE_AUTHORIZATION_PENDING") {
                throw await ApiClientError.fromResponse(response, "Authentication pending. Try again later.");
            } else {
                throw await ApiClientError.fromResponse(
                    response,
                    "Device code expired. Please restart the authentication process."
                );
            }
        } catch {
            throw await ApiClientError.fromResponse(
                response,
                "Failed to retrieve token. Please check your device code."
            );
        }
    }

    async refreshToken(token?: OAuthToken): Promise<OAuthToken | null> {
        const endpoint = "api/private/unauth/account/device/token";
        const url = new URL(endpoint, config.apiBaseUrl);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                refresh_token: (token || this.token)?.refresh_token || "",
                grant_type: "refresh_token",
                scope: "openid profile offline_access",
            }).toString(),
        });

        if (!response.ok) {
            throw await ApiClientError.fromResponse(response, "Failed to refresh token");
        }
        const data = await response.json();

        const buf = Buffer.from(data.access_token.split(".")[1], "base64").toString();
        const jwt = JSON.parse(buf);
        const expiry = new Date(jwt.exp * 1000);

        const tokenToStore = {
            ...data,
            expiry,
        };

        return await this.storeToken(tokenToStore);
    }

    async revokeToken(token?: OAuthToken): Promise<void> {
        const endpoint = "api/private/unauth/account/device/token";
        const url = new URL(endpoint, config.apiBaseUrl);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "User-Agent": config.userAgent,
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                token: (token || this.token)?.access_token || "",
                token_type_hint: "refresh_token",
            }).toString(),
        });

        if (!response.ok) {
            throw await ApiClientError.fromResponse(response);
        }

        if (!token && this.token) {
            this.token = undefined;
        }

        return;
    }

    private checkTokenExpiry(token?: OAuthToken): boolean {
        try {
            token = token || this.token;
            if (!token || !token.access_token) {
                return false;
            }
            if (!token.expiry) {
                return false;
            }
            const expiryDelta = 10 * 1000; // 10 seconds in milliseconds
            const expiryWithDelta = new Date(token.expiry.getTime() - expiryDelta);
            return expiryWithDelta.getTime() > Date.now();
        } catch {
            return false;
        }
    }

    async validateToken(token?: OAuthToken): Promise<boolean> {
        if (this.checkTokenExpiry(token)) {
            return true;
        }

        try {
            await this.refreshToken(token);
            return true;
        } catch {
            return false;
        }
    }

    async getIpInfo() {
        if (!(await this.validateToken())) {
            throw new Error("Not Authenticated");
        }

        const endpoint = "api/private/ipinfo";
        const url = new URL(endpoint, config.apiBaseUrl);
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${this.token!.access_token}`,
                "User-Agent": config.userAgent,
            },
        });

        if (!response.ok) {
            throw await ApiClientError.fromResponse(response);
        }

        const responseBody = await response.json();
        return responseBody as {
            currentIpv4Address: string;
        };
    }

    async listProjects(options?: FetchOptions<operations["listProjects"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups`, options);
        return data;
    }

    async listProjectIpAccessLists(options: FetchOptions<operations["listProjectIpAccessLists"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/accessList`, options);
        return data;
    }

    async createProjectIpAccessList(options: FetchOptions<operations["createProjectIpAccessList"]>) {
        const { data } = await this.client.POST(`/api/atlas/v2/groups/{groupId}/accessList`, options);
        return data;
    }

    async getProject(options: FetchOptions<operations["getProject"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}`, options);
        return data;
    }

    async listClusters(options: FetchOptions<operations["listClusters"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/clusters`, options);
        return data;
    }

    async listClustersForAllProjects(options?: FetchOptions<operations["listClustersForAllProjects"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/clusters`, options);
        return data;
    }

    async getCluster(options: FetchOptions<operations["getCluster"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/clusters/{clusterName}`, options);
        return data;
    }

    async createCluster(options: FetchOptions<operations["createCluster"]>) {
        const { data } = await this.client.POST("/api/atlas/v2/groups/{groupId}/clusters", options);
        return data;
    }

    async createDatabaseUser(options: FetchOptions<operations["createDatabaseUser"]>) {
        const { data } = await this.client.POST("/api/atlas/v2/groups/{groupId}/databaseUsers", options);
        return data;
    }

    async listDatabaseUsers(options: FetchOptions<operations["listDatabaseUsers"]>) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/databaseUsers`, options);
        return data;
    }
}
