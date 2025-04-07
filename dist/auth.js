import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { globalState, log } from "./index.js";
// Replace __dirname with import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Remove imports for missing utils and define wait and fetchDynamic locally
const wait = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};
const TOKEN_FILE = process.env.TOKEN_FILE || path.resolve(__dirname, "token.json");
export const authState = {
    deviceCode: "",
    verificationUri: "",
    userCode: "",
    clientId: process.env.CLIENT_ID || "0oabtxactgS3gHIR0297",
};
export async function authenticate() {
    log("info", "Starting authentication process...");
    const authUrl = "https://cloud.mongodb.com/api/private/unauth/account/device/authorize";
    log("info", `Client ID: ${authState.clientId}`);
    const deviceCodeResponse = await fetch(authUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "User-Agent": `AtlasMCP/${process.env.VERSION} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
        },
        body: new URLSearchParams({
            client_id: authState.clientId,
            scope: "openid profile offline_access",
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }).toString(),
    });
    const responseText = await deviceCodeResponse.text();
    log("info", `Device Code Response Body: ${responseText}`);
    if (!deviceCodeResponse.ok) {
        log("error", `Failed to initiate authentication: ${deviceCodeResponse.statusText}`);
        throw new Error(`Failed to initiate authentication: ${deviceCodeResponse.statusText}`);
    }
    const deviceCodeData = JSON.parse(responseText);
    authState.deviceCode = deviceCodeData.device_code;
    authState.verificationUri = deviceCodeData.verification_uri;
    authState.userCode = deviceCodeData.user_code;
    return {
        verificationUri: deviceCodeData.verification_uri,
        userCode: deviceCodeData.user_code,
    };
}
export async function pollToken() {
    log("info", "Starting token polling process...");
    if (!authState.deviceCode) {
        throw new Error("Device code not found. Please initiate authentication first.");
    }
    const tokenEndpoint = "https://cloud.mongodb.com/api/private/unauth/account/device/token";
    const interval = 5 * 1000;
    const expiresAt = Date.now() + 2 * 60 * 1000;
    while (Date.now() < expiresAt) {
        await wait(interval);
        const OAuthToken = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: authState.clientId,
                device_code: authState.deviceCode,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            }).toString(),
        });
        const responseText = await OAuthToken.text();
        log("info", `Token Response Body: ${responseText}`);
        if (OAuthToken.ok) {
            const tokenData = JSON.parse(responseText);
            globalState.auth = true;
            saveToken(tokenData);
            return tokenData.access_token;
        }
        else {
            const errorResponse = JSON.parse(responseText);
            log("error", `Token polling error: ${errorResponse.error}`);
            if (errorResponse.errorCode === "DEVICE_AUTHORIZATION_PENDING") {
                log("info", "Device authorization is pending. Please try again later.");
                continue;
            }
            else if (errorResponse.error === "expired_token") {
                throw new Error("Device code expired. Please restart the authentication process.");
            }
            else {
                throw new Error(`Failed to authenticate: ${errorResponse.error_description || "Unknown error"}`);
            }
        }
    }
    throw new Error("Authentication timed out. Please restart the process.");
}
export function saveToken(token) {
    globalState.auth = true;
    authState.token = token;
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
    log("info", "Token saved to file.");
}
function loadToken() {
    if (fs.existsSync(TOKEN_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
            // Extract the token property from the data object
            if (data && data.token) {
                authState.token = data.token;
                globalState.auth = true;
                log("info", "Token loaded from file.");
                return data;
            }
            log("info", "Token file exists but doesn't contain a valid token structure");
        }
        catch (error) {
            log("error", `Error parsing token file: ${error}`);
        }
    }
    return undefined;
}
// Check if token exists, if it's valid and refreshes it if necessary
export async function isAuthenticated() {
    log("info", "Checking authentication status...");
    if (globalState.auth) {
        return true;
    }
    const token = await getToken();
    return globalState.auth;
}
export async function getToken() {
    // Try to load token from file if not already loaded
    if (!authState.token) {
        loadToken();
    }
    if (!authState.token) {
        globalState.auth = false;
        log("info", "No token found after loading");
        return null;
    }
    // Validate the existing token
    try {
        log("info", "Validating token...");
        if (validateToken(authState.token)) {
            globalState.auth = true;
            return authState.token;
        }
        // If the token is invalid, attempt to refresh it
        log("info", "Token is invalid, refreshing...");
        const refreshedToken = await refreshToken(authState.token.refresh_token);
        if (refreshedToken) {
            authState.token = refreshedToken;
            globalState.auth = true;
            log("info", "Token refreshed successfully.");
            saveToken(refreshedToken);
            return refreshedToken;
        }
        log("error", "Failed to refresh token.");
    }
    catch (error) {
        log("error", `Error during token validation or refresh: ${error}`);
    }
    globalState.auth = false;
    return null;
}
function validateToken(tokenData) {
    try {
        // First check if token exists and has an access token (similar to Go's Valid() function)
        if (!tokenData || !tokenData.access_token) {
            return false;
        }
        // If expiry is zero value (not set), consider token not expired (like in Go)
        if (!tokenData.expiry) {
            return false;
        }
        // Match the Go code's expiryDelta concept (10 seconds)
        const expiryDelta = 10 * 1000; // 10 seconds in milliseconds
        // Calculate if token is expired using the same logic as Go code:
        // return t.Expiry.Round(0).Add(-expiryDelta).Before(time.Now())
        const expiryWithDelta = new Date(new Date(tokenData.expiry).getTime() - expiryDelta);
        // Token is valid if expiry time minus delta is after current time
        // log to debug
        log("info", `Token expiry time: ${expiryWithDelta}`);
        log("info", `Current time: ${Date.now()}`);
        log("info", `Token is valid: ${expiryWithDelta.getTime() > Date.now()}`);
        return expiryWithDelta.getTime() > Date.now();
    }
    catch (error) {
        log("error", `Error validating token: ${error}`);
        return false;
    }
}
async function refreshToken(token) {
    try {
        const response = await fetch("https://cloud.mongodb.com/api/private/unauth/account/device/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "User-Agent": `AtlasMCP/${process.env.VERSION} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
            },
            body: new URLSearchParams({
                client_id: authState.clientId,
                refresh_token: token,
                grant_type: "refresh_token",
                scope: "openid profile offline_access",
            }).toString(),
        });
        if (response.ok) {
            const data = await response.json();
            const buf = Buffer.from(data.access_token.split('.')[1], 'base64').toString();
            const jwt = JSON.parse(buf);
            const expiry = new Date(jwt.exp * 1000);
            return { ...data, expiry };
        }
    }
    catch (error) {
        log("info", `Error refreshing token: ${error}`);
    }
    return null;
}
async function revokeToken(token) {
    try {
        const response = await fetch("https://cloud.mongodb.com/api/private/unauth/account/device/revoke", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "User-Agent": `AtlasMCP/${process.env.VERSION} (${process.platform}; ${process.arch}; ${process.env.HOSTNAME || "unknown"})`,
            },
            body: new URLSearchParams({
                client_id: authState.clientId,
                token,
                token_type_hint: "refresh_token",
            }).toString(),
        });
        if (!response.ok) {
            log("error", `Failed to revoke token: ${response.statusText}`);
        }
    }
    catch (error) {
        log("error", `Error revoking token: ${error}`);
    }
}
