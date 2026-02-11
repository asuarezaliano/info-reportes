"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buscarDeclaraciones,
  reportePorPais,
  reportePorImportador,
  reportePorDepartamento,
  resumenGeneral,
  type FiltrosBusqueda,
} from "@/services/declaraciones.service";
import styles from "./page.module.css";

export default function DatosPage() {
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({ limit: 25 });
  const [pagina, setPagina] = useState(0);
  const [tabReporte, setTabReporte] = useState<"pais" | "importador" | "depto">("pais");
  const [mesInput, setMesInput] = useState("");
  const [anioInput, setAnioInput] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [anioFiltro, setAnioFiltro] = useState("");

  const { data: listado, isLoading } = useQuery({
    queryKey: ["declaraciones", filtros, pagina],
    queryFn: () =>
      buscarDeclaraciones({
        ...filtros,
        offset: pagina * (filtros.limit || 25),
      }),
  });

  const { data: resumen } = useQuery({
    queryKey: ["resumen", mesFiltro, anioFiltro],
    queryFn: () =>
      resumenGeneral(mesFiltro || undefined, anioFiltro ? parseInt(anioFiltro) : undefined),
  });

  const { data: reportePais } = useQuery({
    queryKey: ["reporte-pais", mesFiltro, anioFiltro],
    queryFn: () =>
      reportePorPais(mesFiltro || undefined, anioFiltro ? parseInt(anioFiltro) : undefined),
    enabled: tabReporte === "pais",
  });

  const { data: reporteImportador } = useQuery({
    queryKey: ["reporte-importador", mesFiltro],
    queryFn: () => reportePorImportador(mesFiltro || undefined, 15),
    enabled: tabReporte === "importador",
  });

  const { data: reporteDepto } = useQuery({
    queryKey: ["reporte-depto", mesFiltro],
    queryFn: () => reportePorDepartamento(mesFiltro || undefined),
    enabled: tabReporte === "depto",
  });

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setFiltros({
      busqueda: (form.elements.namedItem("busqueda") as HTMLInputElement)?.value || undefined,
      pais_orige: (form.elements.namedItem("pais_orige") as HTMLInputElement)?.value || undefined,
      importador: (form.elements.namedItem("importador") as HTMLInputElement)?.value || undefined,
      mes: (form.elements.namedItem("mes") as HTMLInputElement)?.value || undefined,
      depto_des: (form.elements.namedItem("depto_des") as HTMLInputElement)?.value || undefined,
      descripcion: (form.elements.namedItem("descripcion") as HTMLInputElement)?.value || undefined,
      limit: 25,
    });
    setPagina(0);
  };

  const totalPaginas = listado
    ? Math.ceil(listado.total / (filtros.limit || 25))
    : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Datos Aduaneros</h1>
        <p>Carga archivos Excel o CSV, busca y genera reportes</p>
      </header>

      <section className={styles.resumen}>
        {resumen && (
          <div className={styles.cards}>
            <div className={styles.card}>
              <span>Total registros</span>
              <strong>{resumen.totalRegistros.toLocaleString()}</strong>
            </div>
            <div className={styles.card}>
              <span>Total CIF (USD)</span>
              <strong>{resumen.totalCif.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className={styles.card}>
              <span>Total FOB (USD)</span>
              <strong>{resumen.totalFob.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        )}
      </section>

      <section className={styles.busqueda}>
        <h2>Búsqueda</h2>
        <form onSubmit={handleBuscar} className={styles.searchForm}>
          <input
            name="busqueda"
            placeholder="Buscar en país, importador, descripción..."
            className={styles.input}
          />
          <input
            name="pais_orige"
            placeholder="País origen"
            className={styles.input}
          />
          <input
            name="importador"
            placeholder="Importador"
            className={styles.input}
          />
          <input
            name="descripcion"
            placeholder="Descripción producto"
            className={styles.input}
          />
          <input name="mes" placeholder="Mes (ej: OCT25)" className={styles.input} />
          <input
            name="depto_des"
            placeholder="Departamento"
            className={styles.input}
          />
          <button type="submit" className={styles.btnPrimary}>
            Buscar
          </button>
        </form>
      </section>

      <section className={styles.reportes}>
        <h2>Reportes</h2>
        <div className={styles.reportFilters}>
          <input
            placeholder="Mes (OCT25)"
            value={mesInput}
            onChange={(e) => setMesInput(e.target.value)}
            className={styles.input}
          />
          <input
            placeholder="Año"
            value={anioInput}
            onChange={(e) => setAnioInput(e.target.value)}
            className={styles.input}
          />
          <button
            onClick={() => {
              setMesFiltro(mesInput);
              setAnioFiltro(anioInput);
            }}
            className={styles.btnPrimary}
          >
            Aplicar
          </button>
          <button onClick={() => setTabReporte("pais")} className={tabReporte === "pais" ? styles.btnActive : ""}>
            Por país
          </button>
          <button onClick={() => setTabReporte("importador")} className={tabReporte === "importador" ? styles.btnActive : ""}>
            Por importador
          </button>
          <button onClick={() => setTabReporte("depto")} className={tabReporte === "depto" ? styles.btnActive : ""}>
            Por departamento
          </button>
        </div>

        <div className={styles.tablaReporte}>
          {tabReporte === "pais" && reportePais && (
            <table>
              <thead>
                <tr>
                  <th>País</th>
                  <th>Registros</th>
                  <th>Total CIF (USD)</th>
                  <th>Total FOB (USD)</th>
                </tr>
              </thead>
              <tbody>
                {reportePais.map((r) => (
                  <tr key={r.pais}>
                    <td>{r.pais}</td>
                    <td>{r.cantidadRegistros}</td>
                    <td>{r.totalCif.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td>{r.totalFob.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tabReporte === "importador" && reporteImportador && (
            <table>
              <thead>
                <tr>
                  <th>Importador</th>
                  <th>NIT</th>
                  <th>Registros</th>
                  <th>Total CIF (USD)</th>
                </tr>
              </thead>
              <tbody>
                {reporteImportador.map((r, i) => (
                  <tr key={i}>
                    <td>{r.importador}</td>
                    <td>{r.nit}</td>
                    <td>{r.cantidadRegistros}</td>
                    <td>{r.totalCif.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tabReporte === "depto" && reporteDepto && (
            <table>
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Registros</th>
                  <th>Total CIF (USD)</th>
                  <th>Total FOB (USD)</th>
                </tr>
              </thead>
              <tbody>
                {reporteDepto.map((r) => (
                  <tr key={r.departamento}>
                    <td>{r.departamento}</td>
                    <td>{r.cantidadRegistros}</td>
                    <td>{r.totalCif.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td>{r.totalFob.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className={styles.datos}>
        <h2>Datos ({listado?.total ?? 0} registros)</h2>
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.tablaDatos}>
                <thead>
                  <tr>
                    <th>Nro</th>
                    <th>País</th>
                    <th>Importador</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>CIF (USD)</th>
                    <th>Mes</th>
                    <th>Depto</th>
                  </tr>
                </thead>
                <tbody>
                  {listado?.data.map((d) => (
                    <tr key={d.id}>
                      <td>{d.nro_consec}</td>
                      <td>{d.pais_orige}</td>
                      <td>{d.importador}</td>
                      <td className={styles.desc}>
                        {d.descripcio ? String(d.descripcio).slice(0, 40) + "..." : "-"}
                      </td>
                      <td>{d.cantidad}</td>
                      <td>{d.cif_item?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td>{d.mes}</td>
                      <td>{d.depto_des}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPaginas > 1 && (
              <div className={styles.paginacion}>
                <button
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                >
                  Anterior
                </button>
                <span>
                  Página {pagina + 1} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
