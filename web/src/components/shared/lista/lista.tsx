import type { ReactNode } from "react";
import styles from "./lista.module.css";

export type ListaColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  onHeaderClick?: () => void;
  headerClassName?: string;
  cellClassName?: string;
  align?: "left" | "right" | "center";
};

type ListaProps<T> = {
  columns: ListaColumn<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  emptyText?: string;
  maxHeight?: number;
  wrapperClassName?: string;
  tableClassName?: string;
};

const cx = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" ");

export default function Lista<T>({
  columns,
  data,
  rowKey,
  emptyText = "Sin datos",
  maxHeight,
  wrapperClassName,
  tableClassName,
}: ListaProps<T>) {
  return (
    <div
      className={cx(styles.tableWrapper, wrapperClassName)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className={cx(styles.table, styles.rowHover, tableClassName)}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                onClick={col.onHeaderClick}
                className={cx(
                  col.sortable && col.onHeaderClick && styles.sortable,
                  col.align === "right" && styles.alignRight,
                  col.align === "center" && styles.alignCenter,
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={rowKey ? rowKey(row, index) : index}>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cx(
                      col.align === "right" && styles.alignRight,
                      col.align === "center" && styles.alignCenter,
                      col.cellClassName
                    )}
                  >
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
