import config from "../../config.js";
import createClient, { Middleware } from "openapi-fetch";

import {
    paths,
    ClusterDescription20240805,
    NetworkPermissionEntry,
    CloudDatabaseUser,
} from "./openapi.js";

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
}

export interface ApiClientOptions {
    token?: OAuthToken;
    saveToken?: saveTokenFunction;
}

export class ApiClient {
    private token?: OAuthToken;
    private saveToken?: saveTokenFunction;
    private client = createClient<paths>({
        baseUrl: config.apiBaseURL,
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
                request.headers.set("Authorization", `Bearer ${apiClient.token?.access_token}`);
                return request;
            }
        },
    });
    private errorMiddleware = (): Middleware => ({
        async onResponse({ response }) {
            if (!response.ok) {
                throw new ApiClientError(`Error calling Atlas API: ${await response.text()}`, response);
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

        const authUrl = new URL(endpoint, config.apiBaseURL);

        const response = await fetch(authUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: config.clientID,
                scope: "openid profile offline_access",
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            }).toString(),
        });

        if (!response.ok) {
            throw new ApiClientError(`Failed to initiate authentication: ${response.statusText}`, response);
        }

        return (await response.json()) as OauthDeviceCode;
    }

    async retrieveToken(device_code: string): Promise<OAuthToken> {
        const endpoint = "api/private/unauth/account/device/token";
        const url = new URL(endpoint, config.apiBaseURL);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: config.clientID,
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
                throw new ApiClientError("Authentication pending. Try again later.", response);
            } else if (errorResponse.error === "expired_token") {
                throw new ApiClientError("Device code expired. Please restart the authentication process.", response);
            } else {
                throw new ApiClientError("Device code expired. Please restart the authentication process.", response);
            }
        } catch {
            throw new ApiClientError("Failed to retrieve token. Please check your device code.", response);
        }
    }

    async refreshToken(token?: OAuthToken): Promise<OAuthToken | null> {
        const endpoint = "api/private/unauth/account/device/token";
        const url = new URL(endpoint, config.apiBaseURL);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: config.clientID,
                refresh_token: (token || this.token)?.refresh_token || "",
                grant_type: "refresh_token",
                scope: "openid profile offline_access",
            }).toString(),
        });

        if (!response.ok) {
            throw new ApiClientError(`Failed to refresh token: ${response.statusText}`, response);
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
        const url = new URL(endpoint, config.apiBaseURL);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "User-Agent": config.userAgent,
            },
            body: new URLSearchParams({
                client_id: config.clientID,
                token: (token || this.token)?.access_token || "",
                token_type_hint: "refresh_token",
            }).toString(),
        });

        if (!response.ok) {
            throw new ApiClientError(`Failed to revoke token: ${response.statusText}`, response);
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

    async listProjects() {
        const { data } = await this.client.GET(`/api/atlas/v2/groups`);
        return data;
    }

    async listProjectIpAccessLists(groupId: string) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/accessList`, {
            params: {
                path: {
                    groupId,
                }
            }
        });
        return data;
    }

    async createProjectIpAccessList(
        groupId: string,
        ...entries: NetworkPermissionEntry[]
    ) {
        const { data } = await this.client.POST(`/api/atlas/v2/groups/{groupId}/accessList`, {
            params: {
                path: {
                    groupId,
                }
            },
            body: entries,
        });
        return data;
    }

    async getProject(groupId: string) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}`, {
            params: {
                path: {
                    groupId,
                }
            }
        });
        return data;
    }

    async listClusters(groupId: string) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/clusters`, {
            params: {
                path: {
                    groupId,
                }
            }
        });
        return data;
    }

    async listClustersForAllProjects() {
        const { data } = await this.client.GET(`/api/atlas/v2/clusters`);
        return data;
    }

    async getCluster(groupId: string, clusterName: string) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/clusters/{clusterName}`, {
            params: {
                path: {
                    groupId,
                    clusterName,
                }
            }
        });
        return data;
    }

    async createCluster(groupId: string, cluster: ClusterDescription20240805) {
        const { data } = await this.client.POST('/api/atlas/v2/groups/{groupId}/clusters', {
            params: {
                path: {
                    groupId,
                }
            },
            body: cluster,
        });
        return data;
    }

    async createDatabaseUser(groupId: string, user: CloudDatabaseUser) {
        const { data } = await this.client.POST('/api/atlas/v2/groups/{groupId}/databaseUsers', {
            params: {
                path: {
                    groupId,
                }
            },
            body: user,
        });
        return data;
    }

    async listDatabaseUsers(groupId: string) {
        const { data } = await this.client.GET(`/api/atlas/v2/groups/{groupId}/databaseUsers`, {
            params: {
                path: {
                    groupId,
                }
            }
        });
        return data;
    }
}
