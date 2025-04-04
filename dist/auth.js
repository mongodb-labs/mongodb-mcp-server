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
const fetchDynamic = async () => (await import("node-fetch")).default;
const TOKEN_FILE = path.resolve(__dirname, "token.json");
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
    const deviceCodeResponse = await (await fetchDynamic())(authUrl, {
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
        const OAuthToken = await (await fetchDynamic())(tokenEndpoint, {
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
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
    log("info", "Token saved to file.");
}
export function getToken() {
    if (!authState.token) {
        loadToken();
    }
    return authState.token;
}
function loadToken() {
    if (fs.existsSync(TOKEN_FILE)) {
        const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
        authState.token = data.token;
        globalState.auth = true;
        log("info", "Token loaded from file.");
        return data;
    }
    return undefined;
}
// Check if token exists, if it's valid and refreshes it if necessary
export async function isAuthenticated() {
    log("info", "Checking authentication status...");
    if (globalState.auth) {
        return true;
    }
    // Try to load token from file if not already loaded
    if (!authState.token) {
        loadToken();
    }
    if (!authState.token) {
        return false;
    }
    // Validate the existing token
    try {
        const isValid = await validateToken(authState.token);
        if (isValid) {
            return true;
        }
        // If the token is invalid, attempt to refresh it
        const refreshedToken = await refreshToken(authState.token.access_token);
        if (refreshedToken) {
            authState.token = refreshedToken;
            globalState.auth = true;
            saveToken(refreshedToken);
            return true;
        }
    }
    catch (error) {
        log("error", `Error during token validation or refresh: ${error}`);
    }
    globalState.auth = false;
    return false;
}
async function validateToken(tokenData) {
    try {
        const expiryDate = new Date(tokenData.expiry);
        return expiryDate > new Date(); // Token is valid if expiry is in the future
    }
    catch (error) {
        log("error", `Error validating token: ${error}`);
        return false;
    }
}
async function refreshToken(token) {
    try {
        const response = await (await fetchDynamic())("https://cloud.mongodb.com/api/private/unauth/account/device/token", {
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
            const data = (await response.json());
            return data;
        }
    }
    catch (error) {
        log("error", `Error refreshing token: ${error}`);
    }
    return null;
}
async function revokeToken(token) {
    try {
        const response = await (await fetchDynamic())("https://cloud.mongodb.com/api/private/unauth/account/device/revoke", {
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
