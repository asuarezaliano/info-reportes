import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Infonect</h1>
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
