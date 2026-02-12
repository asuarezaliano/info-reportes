"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Logo } from "@/components/ui";
import styles from "./login-form.module.css";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
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
        <Logo size={86} />
      </div>
      <h1 className={styles.title}>Infonect</h1>
      <p className={styles.subtitle}>Inicia sesion para acceder a datos aduaneros</p>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {loginMutation.error && (
          <div className={styles.error}>{loginMutation.error.message}</div>
        )}

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
          />
          {errors.email && (
            <span className={styles.fieldError}>{errors.email.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <span className={styles.fieldError}>
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
