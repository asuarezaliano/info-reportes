import { clearAuthToken, getAuthToken } from "@/lib/auth-token";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  if (res.status === 401 && typeof window !== "undefined") {
    clearAuthToken();
    window.location.href = "/login";
    throw new Error("Sesion expirada. Inicia sesion nuevamente.");
  }

  const error = await res.json().catch(() => ({}));
  throw new Error(error.message || fallbackMessage);
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = getAuthToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    await throwApiError(res, "Error en la peticion");
  }

  return res.json();
}
