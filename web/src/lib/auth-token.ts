const TOKEN_KEY = "token";
const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

function isHttps(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${TOKEN_KEY}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(TOKEN_KEY.length + 1));
}

export function setAuthToken(token: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = isHttps() ? "; Secure" : "";
  document.cookie =
    `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${SEVEN_DAYS_IN_SECONDS}; SameSite=Lax${secure}`;
}

export function clearAuthToken(): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = isHttps() ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
