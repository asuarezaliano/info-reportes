import Link from "next/link";
import { Logo } from "@/components/ui";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <nav style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <Link href="/datos" className={styles.link}>
          Datos y reportes
        </Link>
        <Link href="/login" className={styles.link}>
          Login
        </Link>
      </nav>
    </div>
  );
}
