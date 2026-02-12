"use client";

import { usePathname } from "next/navigation";
import styles from "./app-shell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showFooter = pathname !== "/login";
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.shell}>
      <main className={styles.content}>{children}</main>

      {showFooter && (
        <footer className={styles.footer}>
          <div className={styles.footerLine} />
          <p className={styles.copyright}>
            Copyright {currentYear} Infonect. Todos los derechos reservados.
          </p>
        </footer>
      )}
    </div>
  );
}
