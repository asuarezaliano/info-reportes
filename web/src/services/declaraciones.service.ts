const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error al importar");
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
  cantidad: number | null;
  acuerdo_co: string | null;
  cif_item: number | null;
  fob: number | null;
  importador: string | null;
  despachant: string | null;
  proveedor: string | null;
  depto_des: string | null;
  mes: string | null;
  canal: string | null;
  fecha_reg: string | null;
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

  if (!res.ok) throw new Error("Error al buscar");
  return res.json();
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await fetch(`${API_URL}/declaraciones/filtros/opciones`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al cargar opciones de filtros");
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
  mes?: string,
  anio?: number
): Promise<ReportePais[]> {
  const params = new URLSearchParams();
  if (mes) params.set("mes", mes);
  if (anio) params.set("anio", String(anio));

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/por-pais?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) throw new Error("Error al cargar reporte");
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
  mes?: string,
  limit?: number
): Promise<ReporteImportador[]> {
  const params = new URLSearchParams();
  if (mes) params.set("mes", mes);
  if (limit) params.set("limit", String(limit));

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/por-importador?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) throw new Error("Error al cargar reporte");
  return res.json();
}

export type ReporteDepartamento = {
  departamento: string;
  totalCif: number;
  totalFob: number;
  cantidadRegistros: number;
};

export async function reportePorDepartamento(
  mes?: string
): Promise<ReporteDepartamento[]> {
  const params = mes ? `?mes=${mes}` : "";
  const res = await fetch(
    `${API_URL}/declaraciones/reportes/por-departamento${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) throw new Error("Error al cargar reporte");
  return res.json();
}

export type ResumenGeneral = {
  totalRegistros: number;
  totalCif: number;
  totalFob: number;
  totalCantidad: number;
};

export async function resumenGeneral(
  mes?: string,
  anio?: number
): Promise<ResumenGeneral> {
  const params = new URLSearchParams();
  if (mes) params.set("mes", mes);
  if (anio) params.set("anio", String(anio));

  const res = await fetch(
    `${API_URL}/declaraciones/reportes/resumen?${params}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) throw new Error("Error al cargar resumen");
  return res.json();
}
