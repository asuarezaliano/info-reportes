import type { Metadata } from "next";
import LoginForm from "@/components/login/login-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
}
