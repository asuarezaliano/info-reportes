import LoginForm from "@/components/login/login-form";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
}
