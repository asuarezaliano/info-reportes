import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "@/services/auth.service";

export function useLogin() {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      window.location.href = "/";
    },
  });
}
