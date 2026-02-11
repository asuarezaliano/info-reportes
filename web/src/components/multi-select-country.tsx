"use client";

import { useState, useRef, useEffect } from "react";
import { getFlag } from "@/lib/country-flags";
import styles from "./multi-select-country.module.css";

type Props = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
};

export default function MultiSelectCountry({ options, selected, onChange, placeholder = "Todos los países" }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearch("");
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 ? (
          <span className={styles.placeholder}>{placeholder}</span>
        ) : (
          <span className={styles.tags}>
            {selected.slice(0, 3).map((s) => (
              <span key={s} className={styles.tag}>
                {getFlag(s)} {s}
                <span
                  className={styles.tagRemove}
                  onClick={(e) => { e.stopPropagation(); toggle(s); }}
                >
                  ×
                </span>
              </span>
            ))}
            {selected.length > 3 && (
              <span className={styles.tagMore}>+{selected.length - 3}</span>
            )}
          </span>
        )}
        <span className={styles.arrow}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.search}
            placeholder="Buscar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {selected.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={clearAll}>
              Limpiar selección
            </button>
          )}
          <div className={styles.list}>
            {filtered.map((pais) => (
              <label key={pais} className={styles.option}>
                <input
                  type="checkbox"
                  checked={selected.includes(pais)}
                  onChange={() => toggle(pais)}
                />
                <span className={styles.flag}>{getFlag(pais)}</span>
                <span className={styles.name}>{pais}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className={styles.empty}>No se encontraron países</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
