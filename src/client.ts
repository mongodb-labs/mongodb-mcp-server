import config from "./config.js";

export interface OAuthToken {
    access_token: string;
    refresh_token: string;
    scope: string;
    id_token: string;
    token_type: string;
    expires_in: number;
    expiry: Date;
}

export interface AtlasProject {
    id: string;
    name: string;
    created?: {
        $date: string;
    };
    [key: string]: any;
}

export interface AtlasCluster {
    id?: string;
    name: string;
    stateName: string;
    mongoDBVersion?: string;
    providerSettings?: {
        regionName?: string;
    };
    connectionStrings?: {
        standard?: string;
    };
    [key: string]: any;
}

export interface OauthDeviceCode {
    user_code: string;
    verification_uri: string;
    device_code: string;
    expires_in: string;
    interval: string;
}

export interface AtlasResponse<T> {
    results: T[];
    totalCount?: number;
    [key: string]: any;
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
    token?: OAuthToken;
    saveToken?: saveTokenFunction;

    constructor(options: ApiClientOptions) {
        const { token, saveToken } = options;
        this.token = token;
        this.saveToken = saveToken;
    }

    private defaultOptions(): RequestInit {
        const authHeaders = !this.token?.access_token
            ? null
            : {
                  Authorization: `Bearer ${this.token.access_token}`,
              };

        return {
            method: "GET",
            credentials: !this.token?.access_token ? undefined : "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/vnd.atlas.2025-04-07+json",
                "User-Agent": config.userAgent,
                ...authHeaders,
            },
        };
    }

    async storeToken(token: OAuthToken): Promise<OAuthToken> {
        this.token = token;

        if (this.saveToken) {
            await this.saveToken(token);
        }

        return token;
    }

    async do<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
        if (!this.token || !this.token.access_token) {
            throw new Error("Not authenticated. Please run the auth tool first.");
        }

        const url = new URL(`api/atlas/v2${endpoint}`, `${config.apiBaseURL}`);

        if (!this.checkTokenExpiry()) {
            await this.refreshToken();
        }

        const defaultOpt = this.defaultOptions();
        const opt = {
            ...defaultOpt,
            ...options,
            headers: {
                ...defaultOpt.headers,
                ...options?.headers,
            },
        };
        const response = await fetch(url, opt);

        if (!response.ok) {
            throw new ApiClientError(`Error calling Atlas API: ${response.statusText}`, response);
        }

        return (await response.json()) as T;
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all projects for the authenticated user
     */
    async listProjects(): Promise<AtlasResponse<AtlasProject>> {
        return await this.do<AtlasResponse<AtlasProject>>("/groups");
    }

    /**
     * Get a specific project by ID
     */
    async getProject(projectId: string): Promise<AtlasProject> {
        return await this.do<AtlasProject>(`/groups/${projectId}`);
    }

    /**
     * Get clusters for a specific project
     */
    async listProjectClusters(projectId: string): Promise<AtlasResponse<AtlasCluster>> {
        return await this.do<AtlasResponse<AtlasCluster>>(`/groups/${projectId}/clusters`);
    }

    /**
     * Get clusters for a specific project
     */
    async listAllClusters(): Promise<AtlasResponse<AtlasCluster>> {
        return await this.do<AtlasResponse<AtlasCluster>>(`/clusters`);
    }
}
