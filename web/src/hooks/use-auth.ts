import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "@/services/auth.service";
import { setAuthToken } from "@/lib/auth-token";

export function useLogin() {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setAuthToken(data.access_token);
      window.location.href = "/datos";
    },
  });
}
