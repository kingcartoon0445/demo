export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const CURRENT_ORG_KEY = "currentOrgId";

// === Cookie helpers ===
function setCookie(name: string, value: string, days = 7) {
    if (typeof document === "undefined") return;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);

    // Check if we're in development (localhost or http)
    const isSecure = window.location.protocol === "https:";
    const secureFlag = isSecure ? "; Secure" : "";

    document.cookie = `${name}=${encodeURIComponent(
        value
    )}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secureFlag}`;
}

function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(
        new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : undefined;
}

// === Auth token API ===
export function setAuthTokens(accessToken: string, refreshToken?: string) {
    setCookie(ACCESS_TOKEN_KEY, accessToken);
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
        setCookie(REFRESH_TOKEN_KEY, refreshToken, 14);
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    }
}

export function getAccessToken() {
    return (
        readCookie(ACCESS_TOKEN_KEY) ||
        (typeof localStorage !== "undefined"
            ? localStorage.getItem(ACCESS_TOKEN_KEY) || undefined
            : undefined)
    );
}

export function removeAuthTokens() {
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    if (typeof localStorage !== "undefined") {
        localStorage.clear();
    }
}

// === Organization helpers ===
export function setCurrentOrg(orgId: string) {
    setCookie(CURRENT_ORG_KEY, orgId);
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(CURRENT_ORG_KEY, orgId);
    }
}

export function getCurrentOrg(): string | undefined {
    const localStorageValue =
        typeof localStorage !== "undefined"
            ? localStorage.getItem(CURRENT_ORG_KEY) || undefined
            : undefined;
    const cookieValue = readCookie(CURRENT_ORG_KEY);

    // Prioritize localStorage over cookie as requested
    return localStorageValue || cookieValue;
}

export function removeCurrentOrg() {
    deleteCookie(CURRENT_ORG_KEY);
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem(CURRENT_ORG_KEY);
    }
}
