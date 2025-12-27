/**
 * FatSecret OAuth 2.0 Authentication Service
 *
 * Handles token acquisition and caching for FatSecret Platform API.
 * Tokens are valid for 24 hours (86,400 seconds).
 */

const TOKEN_ENDPOINT = "https://oauth.fatsecret.com/connect/token";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

// In-memory token cache (server-side singleton)
let tokenCache: TokenCache | null = null;

// 5-minute buffer before token expiry to ensure we refresh early
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Get a valid access token for FatSecret API calls.
 * Automatically handles token caching and refresh.
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - REFRESH_BUFFER_MS) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "FatSecret credentials not configured. Set FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET."
    );
  }

  // Encode credentials for Basic auth
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // Request both basic and barcode scopes
    body: "grant_type=client_credentials&scope=basic barcode",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("FatSecret token error:", response.status, errorText);
    throw new Error(`Failed to get FatSecret access token: ${response.status}`);
  }

  const data = await response.json();

  // Cache the token with expiry timestamp
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

/**
 * Clear the cached token (for testing or forced refresh)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

/**
 * Check if a valid token is currently cached
 */
export function hasValidToken(): boolean {
  return tokenCache !== null && Date.now() < tokenCache.expiresAt - REFRESH_BUFFER_MS;
}
