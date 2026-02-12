"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Button, Input, Logo } from "@/components/ui";
import styles from "./login-form.module.css";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLogin();

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <Logo size={190} />
      </div>
      <p className={styles.subtitle}>
        Inicia sesion para acceder a datos aduaneros
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        autoComplete="off"
      >
        {loginMutation.error && (
          <div className={styles.error}>{loginMutation.error.message}</div>
        )}

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            {...register("email")}
          />
          {errors.email && (
            <span className={styles.fieldError}>{errors.email.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Contraseña</label>
          <div className={styles.passwordRow}>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                  <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a16.84 16.84 0 0 1-4.21 5.38" />
                  <path d="M6.61 6.61A16.84 16.84 0 0 0 2 12s3 8 10 8a10.94 10.94 0 0 0 5.09-1.12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className={styles.fieldError}>{errors.password.message}</span>
          )}
        </div>

        <Button
          type="submit"
          variant="green"
          size="md"
          fullWidth
          className={styles.submitButton}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}
