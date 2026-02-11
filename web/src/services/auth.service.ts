import { api } from "@/lib/api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function loginRequest(data: LoginPayload) {
  return api<AuthResponse>("/auth/login", { method: "POST", body: data });
}
