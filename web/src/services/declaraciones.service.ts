import { clearAuthToken, getAuthToken } from "@/lib/auth-token";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfRequestFailed(
  res: Response,
  fallbackMessage: string
): Promise<never> {
  if (res.status === 401 && typeof window !== "undefined") {
    clearAuthToken();
    window.location.href = "/login";
    throw new Error("Sesion expirada. Inicia sesion nuevamente.");
  }

  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || fallbackMessage);
}

export type ResultadoImportacion = {
  importados: number;
  errores: number;
  mensajes: string[];
};

export async function importarArchivo(
  archivo: File
): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const res = await fetch(`${API_URL}/declaraciones/importar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    await throwIfRequestFailed(res, "Error al importar");
  }

  return res.json();
}

export type FiltrosBusqueda = {
  busqueda?: string;
  pais_orige?: string;
  importador?: string;
  proveedor?: string;
  descripcion?: string;
  partida_ar?: string;
  mes?: string;
  depto_des?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type Declaracion = {
  id: string;
  desadu: string | null;
  aduana: string | null;
  anio: number | null;
  serial: string | null;
  nro_consec: string | null;
  nro_item: number | null;
  partida_ar: string | null;
  descripcio: string | null;
  pais_orige: string | null;
  pais_pro: string | null;
  cantidad: number | null;
  acuerdo_co: string | null;
  cif_item: number | null;
  fob: number | null;
  p_neto: number | null;
  p_bruto: number | null;
  importador: string | null;
  despachant: string | null;
  proveedor: string | null;
  depto_des: string | null;
  mes: string | null;
  canal: string | null;
  fecha_reg: string | null;
  fecha_reci: string | null;
  [key: string]: unknown;
};

export type ListadoResultado = {
  data: Declaracion[];
  total: number;
  totalCif: number;
  totalFob: number;
};

export type FilterOptions = {
  paises: string[];
  departamentos: string[];
};

export async function buscarDeclaraciones(
  filtros: FiltrosBusqueda
): Promise<ListadoResultado> {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v != null && v !== "") params.set(k, String(v));
  });

  const res = await fetch(
    `${API_URL}/declaraciones?${params.toString()}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) await throwIfRequestFailed(res, "Error al buscar");
  return res.json();
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await fetch(`${API_URL}/declaraciones/filtros/opciones`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    await throwIfRequestFailed(res, "Error al cargar opciones de filtros");
  }
  return res.json();
}

export type SubPartida = {
  codigo: string;
  descripcion: string;
};

export async function getSubPartidas(capitulo: string): Promise<SubPartida[]> {
  const res = await fetch(
    `${API_URL}/declaraciones/filtros/sub-partidas?capitulo=${capitulo}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) await throwIfRequestFailed(res, "Error al cargar sub-partidas");
  return res.json();
}

export type ReportePais = {
  pais: string;
  totalCif: number;
  totalFob: number;
  totalCantidad: number;
  cantidadRegistros: number;
};

export async function reportePorPais(
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ReportePais[]> {
  const params = new URLSearchParams();
  if (fechaDesde) params.set("fechaDesde", fechaDesde);
  if (fechaHasta) params.set("fechaHasta", fechaHasta);

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/por-pais?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) await throwIfRequestFailed(res, "Error al cargar reporte");
  return res.json();
}

export type ReporteImportador = {
  importador: string;
  nit: string | null;
  totalCif: number;
  totalFob: number;
  cantidadRegistros: number;
};

export async function reportePorImportador(
  fechaDesde?: string,
  fechaHasta?: string,
  limit?: number
): Promise<ReporteImportador[]> {
  const params = new URLSearchParams();
  if (fechaDesde) params.set("fechaDesde", fechaDesde);
  if (fechaHasta) params.set("fechaHasta", fechaHasta);
  if (limit) params.set("limit", String(limit));

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/por-importador?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) await throwIfRequestFailed(res, "Error al cargar reporte");
  return res.json();
}

export type ReporteDepartamento = {
  departamento: string;
  totalCif: number;
  totalFob: number;
  cantidadRegistros: number;
};

export async function reportePorDepartamento(
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ReporteDepartamento[]> {
  const params = new URLSearchParams();
  if (fechaDesde) params.set("fechaDesde", fechaDesde);
  if (fechaHasta) params.set("fechaHasta", fechaHasta);

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/por-departamento?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) await throwIfRequestFailed(res, "Error al cargar reporte");
  return res.json();
}

export type ResumenGeneral = {
  totalRegistros: number;
  totalCif: number;
  totalFob: number;
  totalCantidad: number;
};

export async function resumenGeneral(
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ResumenGeneral> {
  const params = new URLSearchParams();
  if (fechaDesde) params.set("fechaDesde", fechaDesde);
  if (fechaHasta) params.set("fechaHasta", fechaHasta);

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/resumen?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) await throwIfRequestFailed(res, "Error al cargar resumen");
  return res.json();
}

export type EvolucionMensual = {
  mes: string;
  totalCif: number;
  totalFob: number;
  registros: number;
};

export async function evolucionMensual(): Promise<EvolucionMensual[]> {
  const res = await fetch(`${API_URL}/declaraciones/reportes/evolucion-mensual`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    await throwIfRequestFailed(res, "Error al cargar evolucion mensual");
  }
  return res.json();
}

export type TopCategoria = {
  capitulo: string;
  totalCif: number;
  totalFob: number;
  registros: number;
};

export async function topCategorias(limit = 8): Promise<TopCategoria[]> {
  const res = await fetch(
    `${API_URL}/declaraciones/reportes/top-categorias?limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) await throwIfRequestFailed(res, "Error al cargar categorias");
  return res.json();
}

export async function exportarReporteExcel(
  filtros: FiltrosBusqueda
): Promise<void> {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v != null && v !== "" && k !== "limit" && k !== "offset" && k !== "sortBy" && k !== "sortDir") {
      params.set(k, String(v));
    }
  });

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/exportar-excel?${params.toString()}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    await throwIfRequestFailed(res, "Error al generar el reporte");
  }

  // Get filename from Content-Disposition header
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = "reporte.xlsx";
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) {
      filename = decodeURIComponent(match[1]);
    }
  }

  // Download the file
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
