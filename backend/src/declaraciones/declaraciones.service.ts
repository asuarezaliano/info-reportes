import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse as parseCsvStream } from 'csv-parse';
import { parse as parseCsvSync } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import type { Prisma } from '../../generated/prisma/client';
import {
  closeSync,
  createReadStream,
  openSync,
  readFileSync,
  readSync,
} from 'node:fs';

@Injectable()
export class DeclaracionesService {
  // In-memory cache for catalog queries
  private catalogCache = new Map<
    string,
    { data: { codigo: string; descripcion: string }[]; timestamp: number }
  >();
  private static CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(private prisma: PrismaService) {}

  async importarArchivoDesdeDisco(
    filePath: string,
    tipo: 'csv' | 'excel',
    delimiter = '\t',
  ) {
    if (tipo === 'excel') {
      const buffer = readFileSync(filePath);
      return this.importarArchivo(buffer, 'excel', delimiter);
    }

    return this.importarCsvStreamDesdeDisco(filePath, delimiter);
  }

  async importarArchivo(
    buffer: Buffer,
    tipo: 'csv' | 'excel',
    delimiter = '\t',
  ) {
    const records =
      tipo === 'excel'
        ? this.leerExcel(buffer)
        : this.leerCSVBuffer(buffer, delimiter);
    return this.procesarRegistros(records);
  }

  private leerCSVBuffer(buffer: Buffer, delimiter: string) {
    const content = buffer.toString('utf8');
    const detectedDelimiter =
      delimiter && delimiter.length > 0
        ? delimiter
        : this.detectDelimiter(content);
    const fromLine = this.detectFromLine(content, detectedDelimiter);

    return parseCsvSync(content, {
      columns: true,
      delimiter: detectedDelimiter,
      from_line: fromLine,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[];
  }

  private async importarCsvStreamDesdeDisco(
    filePath: string,
    delimiter: string,
  ) {
    const resultados = { importados: 0, errores: 0, mensajes: [] as string[] };

    const preview = this.readFileHead(filePath, 128 * 1024);
    const detectedDelimiter =
      delimiter && delimiter.length > 0
        ? delimiter
        : this.detectDelimiter(preview);
    const fromLine = this.detectFromLine(preview, detectedDelimiter);

    const parser = parseCsvStream({
      columns: true,
      delimiter: detectedDelimiter,
      from_line: fromLine,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
      bom: true,
    });

    const stream = createReadStream(filePath);
    stream.pipe(parser);

    let rowNumber = fromLine;
    for await (const row of parser as AsyncIterable<Record<string, string>>) {
      try {
        const data = this.mapearFila(row);
        if (data) {
          await this.prisma.declaracionAduanera.create({ data });
          resultados.importados++;
        }
      } catch (error) {
        resultados.errores++;
        resultados.mensajes.push(
          `Fila ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        rowNumber++;
      }
    }

    // Sync catalog after import
    if (resultados.importados > 0) {
      await this.syncCatalogo();
    }

    return resultados;
  }

  private readFileHead(filePath: string, bytes: number): string {
    const fd = openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(bytes);
      const read = readSync(fd, buffer, 0, bytes, 0);
      return buffer.subarray(0, read).toString('utf8');
    } finally {
      closeSync(fd);
    }
  }

  private detectDelimiter(content: string): string {
    const firstDataLine =
      content.split(/\r?\n/).find((line) => line && line.trim().length > 0) ??
      '';

    const candidates = ['\t', ';', ',', '|'];
    let best = '\t';
    let bestCount = -1;

    for (const candidate of candidates) {
      const count = firstDataLine.split(candidate).length - 1;
      if (count > bestCount) {
        bestCount = count;
        best = candidate;
      }
    }

    return best;
  }

  private detectFromLine(content: string, delimiter: string): number {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return 1;

    const first = lines[0] ?? '';
    const second = lines[1] ?? '';

    const firstCount = first.split(delimiter).length - 1;
    const secondCount = second.split(delimiter).length - 1;
    const looksLikeTitle = /^tabla\s+\d+/i.test(first.trim());

    return looksLikeTitle || (firstCount === 0 && secondCount > 0) ? 2 : 1;
  }

  private leerExcel(buffer: Buffer): Record<string, string>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', raw: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
      header: 1,
      defval: '',
    });

    if (data.length < 2) return [];

    const headers = (data[0] ?? []).map((h) => String(h));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i] ?? [];
      const obj: Record<string, string> = {};
      headers.forEach((h, j) => {
        const val = row[j];
        obj[h] = val != null ? String(val).trim() : '';
      });
      rows.push(obj);
    }

    return rows;
  }

  private async procesarRegistros(records: Record<string, string>[]) {
    const resultados = { importados: 0, errores: 0, mensajes: [] as string[] };

    for (let i = 0; i < records.length; i++) {
      try {
        const row = records[i];
        const data = this.mapearFila(row);
        if (data) {
          await this.prisma.declaracionAduanera.create({ data });
          resultados.importados++;
        }
      } catch (error) {
        resultados.errores++;
        resultados.mensajes.push(
          `Fila ${i + 2}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Sync catalog after import
    if (resultados.importados > 0) {
      await this.syncCatalogo();
    }

    return resultados;
  }

  async importarCSV(buffer: Buffer, delimiter = '\t') {
    return this.importarArchivo(buffer, 'csv', delimiter);
  }

  /**
   * Sync the PartidaArancelaria catalog from existing declaraciones data.
   * Uses raw SQL GROUP BY for efficiency with large datasets.
   * Upserts: inserts new entries, updates description if changed.
   */
  async syncCatalogo() {
    const partidas = await this.prisma.$queryRaw<
      { partida_ar: string; descripcio: string }[]
    >`
      SELECT DISTINCT ON (partida_ar)
        partida_ar, descripcio
      FROM "DeclaracionAduanera"
      WHERE partida_ar IS NOT NULL AND descripcio IS NOT NULL
      ORDER BY partida_ar, "createdAt" DESC
    `;

    let added = 0;
    let updated = 0;

    for (const p of partidas) {
      const capitulo = p.partida_ar
        .replace(/\D/g, '')
        .slice(0, 2)
        .padStart(2, '0');
      const result = await this.prisma.partidaArancelaria.upsert({
        where: { codigo: p.partida_ar },
        create: {
          codigo: p.partida_ar,
          capitulo,
          descripcion: p.descripcio,
        },
        update: {
          descripcion: p.descripcio,
          capitulo,
        },
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        added++;
      } else {
        updated++;
      }
    }

    // Clear cache after sync
    this.catalogCache.clear();

    return { total: partidas.length, added, updated };
  }

  private mapearFila(
    row: Record<string, string>,
  ): Prisma.DeclaracionAduaneraCreateInput | null {
    const parseDecimal = (val: string) => {
      if (!val || val.trim() === '') return null;
      const num = parseFloat(val.replace(',', '.'));
      return isNaN(num) ? null : num;
    };

    const parseDate = (val: string) => {
      if (!val || val.trim() === '') return null;
      const [d, m, y] = val.split('/');
      if (!d || !m || !y) return null;
      let year = parseInt(y, 10);
      // Handle 2-digit years: assume 2000s for years < 100
      if (year < 100) {
        year = year >= 50 ? 1900 + year : 2000 + year;
      }
      const date = new Date(year, parseInt(m) - 1, parseInt(d));
      return isNaN(date.getTime()) ? null : date;
    };

    const parseIntSafe = (val: string) => {
      if (!val || val.trim() === '') return null;
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    };

    const get = (key: string) => {
      const val = row[key] ?? row[key.toUpperCase()];
      return val?.trim() || null;
    };

    const desadu = get('DESADU');
    const aduana = get('ADUANA');
    if (!desadu && !aduana && !get('NRO_CONSEC')) return null;

    const datosExtra: Record<string, unknown> = {};
    const columnasExtra = [
      'CODIGO_NAC',
      'DECLARACIO',
      'DOC_EMBARQ',
      'C_BULTO',
      'CODIGO_EMB',
      'TIPO_DUI_A',
      'VERSION_A',
      'GA_EFECT',
      'GA_GARAN',
      'GA_LIBER',
      'GA_SIN_P',
      'ICD_EFECT',
      'ICD_LIBER',
      'ICD_GARAN',
      'ICD_SIN_P',
      'ICE_EFECT',
      'ICE_GARAN',
      'ICE_LIBER',
      'ICE_SIN_P',
      'IEHD_EFECT',
      'IEHD_LIBER',
      'IEHD_SIN_P',
      'IMPZONFRAN',
      'INS_PREVIA',
      'IVA_EFECT',
      'IVA_GARAN',
      'IVA_LIBER',
      'IVA_SIN_P',
      'LEVABANDON',
      'VGA_VALOR',
      'VIC_VALOR',
      'VIH_VALOR',
      'VIV_VALOR',
      'NRO_REGIST',
      'CODIGO_MAR',
      'CODIGO_CLA',
      'CODIGO_TIP',
      'CODIGO_SUB',
      'CILINDRADA',
      'MOTOR',
      'CHASIS',
      'ANIO_FABRI',
      'ANIO_MODEL',
      'CODIGO_TRA',
      'NRO_RUEDAS',
      'NRO_PUERTA',
      'CAPACIDAD_',
      'CODIGO_COM',
      'TRANSMISIO',
      'PATRON_DEC',
      'MANIFIESTO',
      'FECHA_MAN',
      'FECHA_LOC',
      'NRO_VAL',
      'FECHA_VAL',
      'FECHA_PAG',
      'FECHA_CAN',
      'FECHA_VIST',
      'FECHA_LEV',
      'FECHA_SAL',
      'DOC_IMP',
      'NRO_DOC',
      'DIR_PROVEE',
      'REG_MAN',
      'TASA_CAM',
      'NAT_TRANS',
      'TRANS_FRO',
      'TRANS_INT',
      'FLETE',
      'SEG',
      'GASTOS',
      'ITMES',
      'RECIBO',
      'TIPO_DUI_B',
      'VERSION_B',
      'FECHA_ENM',
      'REF_DIM',
      'SID_SUMA',
      'HRS_LOCMA',
      'HRS_VALOC',
      'HRS_PAVAL',
      'HRS_CAPAG',
      'HRS_VISCA',
      'HRS_LEVIS',
      'HRS_SALEV',
      'HRS_SALMAN',
    ];

    for (const col of columnasExtra) {
      const val = get(col);
      if (val) datosExtra[col] = val;
    }

    return {
      desadu,
      aduana: get('ADUANA') || aduana,
      anio: parseIntSafe(get('ANIO') ?? ''),
      serial: get('SERIAL'),
      nro_consec: get('NRO_CONSEC'),
      nro_item: parseIntSafe(get('NRO_ITEM') ?? ''),
      partida_ar: get('PARTIDA_AR'),
      unid_med: get('UNID_MED'),
      descripcio: get('DESCRIPCIO'),
      pais_orige: get('PAIS_ORIGE'),
      acuerdo_co: get('ACUERDO_CO'),
      regimen: parseIntSafe(get('REGIMEN') ?? ''),
      p_bruto: parseDecimal(get('P_BRUTO') ?? ''),
      p_neto: parseDecimal(get('P_NETO') ?? ''),
      cantidad: parseDecimal(get('CANTIDAD') ?? ''),
      estado_mer: get('ESTADO_MER'),
      cif_item: parseDecimal(get('CIF_ITEM') ?? ''),
      flete_item: parseDecimal(get('FLETE_ITEM') ?? ''),
      seg_item: parseDecimal(get('SEG_ITEM') ?? ''),
      gast_item: parseDecimal(get('GAST_ITEM') ?? ''),
      fob: parseDecimal(get('FOB') ?? ''),
      cif: parseDecimal(get('CIF') ?? ''),
      importador: get('IMPORTADOR'),
      nit_desp: get('NIT_DESP'),
      despachant: get('DESPACHANT'),
      proveedor: get('PROVEEDOR'),
      pais_pro: get('PAIS_PRO'),
      depto_des: get('DEPTO_DES'),
      fecha_reg: parseDate(get('FECHA_REG') ?? ''),
      mes: get('MES'),
      canal: get('CANAL'),
      tipo_proc: get('TIPO_PROC'),
      embarque: get('EMBARQUE'),
      adu_ing: get('ADU_ING'),
      fecha_reci: parseDate(get('FECHA_RECI') ?? ''),
      datosExtra:
        Object.keys(datosExtra).length > 0
          ? (datosExtra as Prisma.InputJsonValue)
          : undefined,
    };
  }

  private static SORTABLE_COLUMNS = new Set([
    'nro_consec',
    'pais_orige',
    'importador',
    'despachant',
    'descripcio',
    'acuerdo_co',
    'cantidad',
    'fob',
    'cif_item',
    'mes',
    'depto_des',
    'fecha_reg',
    'fecha_reci',
    'p_bruto',
    'p_neto',
    'anio',
  ]);

  async listar(filtros: {
    pais_orige?: string;
    importador?: string;
    proveedor?: string;
    descripcion?: string;
    partida_ar?: string;
    mes?: string;
    depto_des?: string;
    busqueda?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.DeclaracionAduaneraWhereInput = {};

    if (filtros.pais_orige) {
      const paises = filtros.pais_orige
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (paises.length === 1) {
        where.pais_orige = { contains: paises[0], mode: 'insensitive' };
      } else if (paises.length > 1) {
        where.pais_orige = { in: paises };
      }
    }
    if (filtros.importador)
      where.importador = { contains: filtros.importador, mode: 'insensitive' };
    if (filtros.proveedor)
      where.proveedor = { contains: filtros.proveedor, mode: 'insensitive' };
    if (filtros.descripcion)
      where.descripcio = { contains: filtros.descripcion, mode: 'insensitive' };
    if (filtros.partida_ar)
      where.partida_ar = { startsWith: filtros.partida_ar };
    if (filtros.mes) where.mes = filtros.mes;
    if (filtros.depto_des) where.depto_des = filtros.depto_des;

    if (filtros.busqueda) {
      where.OR = [
        { pais_orige: { contains: filtros.busqueda, mode: 'insensitive' } },
        { importador: { contains: filtros.busqueda, mode: 'insensitive' } },
        { proveedor: { contains: filtros.busqueda, mode: 'insensitive' } },
        { descripcio: { contains: filtros.busqueda, mode: 'insensitive' } },
        { partida_ar: { contains: filtros.busqueda, mode: 'insensitive' } },
        { nro_consec: { contains: filtros.busqueda, mode: 'insensitive' } },
      ];
    }

    if (filtros.fecha_desde || filtros.fecha_hasta) {
      where.fecha_reci = {};
      if (filtros.fecha_desde)
        (where.fecha_reci as Prisma.DateTimeFilter).gte = filtros.fecha_desde;
      if (filtros.fecha_hasta)
        (where.fecha_reci as Prisma.DateTimeFilter).lte = filtros.fecha_hasta;
    }

    const orderBy: Record<string, 'asc' | 'desc'> =
      filtros.sortBy &&
      DeclaracionesService.SORTABLE_COLUMNS.has(filtros.sortBy)
        ? { [filtros.sortBy]: filtros.sortDir ?? 'asc' }
        : { fecha_reci: 'desc' };

    const [data, total, agregados] = await Promise.all([
      this.prisma.declaracionAduanera.findMany({
        where,
        take: filtros.limit ?? 50,
        skip: filtros.offset ?? 0,
        orderBy,
      }),
      this.prisma.declaracionAduanera.count({ where }),
      this.prisma.declaracionAduanera.aggregate({
        where,
        _sum: { cif_item: true, fob: true },
      }),
    ]);

    return {
      data,
      total,
      totalCif: Number(agregados._sum.cif_item ?? 0),
      totalFob: Number(agregados._sum.fob ?? 0),
    };
  }

  async getFilterOptions() {
    const [paises, departamentos] = await Promise.all([
      this.prisma.declaracionAduanera.findMany({
        where: { pais_orige: { not: null } },
        select: { pais_orige: true },
        distinct: ['pais_orige'],
        orderBy: { pais_orige: 'asc' },
      }),
      this.prisma.declaracionAduanera.findMany({
        where: { depto_des: { not: null } },
        select: { depto_des: true },
        distinct: ['depto_des'],
        orderBy: { depto_des: 'asc' },
      }),
    ]);

    return {
      paises: paises.map((p) => p.pais_orige).filter(Boolean) as string[],
      departamentos: departamentos
        .map((d) => d.depto_des)
        .filter(Boolean) as string[],
    };
  }

  async getSubPartidas(capitulo: string) {
    // Check in-memory cache first
    const cached = this.catalogCache.get(capitulo);
    if (
      cached &&
      Date.now() - cached.timestamp < DeclaracionesService.CACHE_TTL
    ) {
      return cached.data;
    }

    // Query the lightweight catalog table (indexed by capitulo)
    const partidas = await this.prisma.partidaArancelaria.findMany({
      where: { capitulo },
      orderBy: { codigo: 'asc' },
    });

    const result = partidas.map((p) => ({
      codigo: p.codigo,
      descripcion: p.descripcion,
    }));

    // Store in cache
    this.catalogCache.set(capitulo, { data: result, timestamp: Date.now() });

    return result;
  }

  private buildDateFilter(
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Prisma.DeclaracionAduaneraWhereInput {
    const where: Prisma.DeclaracionAduaneraWhereInput = {};
    if (fechaDesde || fechaHasta) {
      where.fecha_reci = {};
      if (fechaDesde)
        (where.fecha_reci as Prisma.DateTimeFilter).gte = fechaDesde;
      if (fechaHasta)
        (where.fecha_reci as Prisma.DateTimeFilter).lte = fechaHasta;
    }
    return where;
  }

  async reportePorPais(filtros?: { fechaDesde?: Date; fechaHasta?: Date }) {
    const where = this.buildDateFilter(
      filtros?.fechaDesde,
      filtros?.fechaHasta,
    );

    const result = await this.prisma.declaracionAduanera.groupBy({
      by: ['pais_orige'],
      where: { ...where, pais_orige: { not: null } },
      _sum: { cif_item: true, fob: true, cantidad: true },
      _count: true,
    });

    return result
      .filter((r) => r.pais_orige)
      .map((r) => ({
        pais: r.pais_orige,
        totalCif: Number(r._sum.cif_item ?? 0),
        totalFob: Number(r._sum.fob ?? 0),
        totalCantidad: Number(r._sum.cantidad ?? 0),
        cantidadRegistros: r._count,
      }))
      .sort((a, b) => b.totalCif - a.totalCif);
  }

  async reportePorImportador(filtros?: {
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
  }) {
    const where = this.buildDateFilter(
      filtros?.fechaDesde,
      filtros?.fechaHasta,
    );

    const result = await this.prisma.declaracionAduanera.groupBy({
      by: ['importador', 'nit_desp'],
      where: { ...where, importador: { not: null } },
      _sum: { cif_item: true, fob: true },
      _count: true,
    });

    return result
      .filter((r) => r.importador)
      .map((r) => ({
        importador: r.importador,
        nit: r.nit_desp,
        totalCif: Number(r._sum.cif_item ?? 0),
        totalFob: Number(r._sum.fob ?? 0),
        cantidadRegistros: r._count,
      }))
      .sort((a, b) => b.totalCif - a.totalCif);
  }

  async reportePorDepartamento(filtros?: {
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where = this.buildDateFilter(
      filtros?.fechaDesde,
      filtros?.fechaHasta,
    );

    const result = await this.prisma.declaracionAduanera.groupBy({
      by: ['depto_des'],
      where: { ...where, depto_des: { not: null } },
      _sum: { cif_item: true, fob: true },
      _count: true,
    });

    return result
      .filter((r) => r.depto_des)
      .map((r) => ({
        departamento: r.depto_des,
        totalCif: Number(r._sum.cif_item ?? 0),
        totalFob: Number(r._sum.fob ?? 0),
        cantidadRegistros: r._count,
      }))
      .sort((a, b) => b.totalCif - a.totalCif);
  }

  async resumenGeneral(filtros?: { fechaDesde?: Date; fechaHasta?: Date }) {
    const where = this.buildDateFilter(
      filtros?.fechaDesde,
      filtros?.fechaHasta,
    );

    const [agregados, totalRegistros] = await Promise.all([
      this.prisma.declaracionAduanera.aggregate({
        where,
        _sum: { cif_item: true, fob: true, cantidad: true },
      }),
      this.prisma.declaracionAduanera.count({ where }),
    ]);

    return {
      totalRegistros,
      totalCif: Number(agregados._sum.cif_item ?? 0),
      totalFob: Number(agregados._sum.fob ?? 0),
      totalCantidad: Number(agregados._sum.cantidad ?? 0),
    };
  }

  /**
   * Monthly evolution of CIF and FOB values
   */
  async evolucionMensual() {
    const result = await this.prisma.declaracionAduanera.groupBy({
      by: ['mes'],
      where: { mes: { not: null } },
      _sum: { cif_item: true, fob: true },
      _count: true,
    });

    return result
      .filter((r) => r.mes)
      .map((r) => ({
        mes: r.mes,
        totalCif: Number(r._sum.cif_item ?? 0),
        totalFob: Number(r._sum.fob ?? 0),
        registros: r._count,
      }))
      .sort((a, b) => {
        // Sort by year then month: format is like "OCT25", "ENE26"
        const meses: Record<string, number> = {
          ENE: 1,
          FEB: 2,
          MAR: 3,
          ABR: 4,
          MAY: 5,
          JUN: 6,
          JUL: 7,
          AGO: 8,
          SEP: 9,
          OCT: 10,
          NOV: 11,
          DIC: 12,
        };
        const parseMs = (m: string | null) => {
          if (!m) return 0;
          const mes = m.slice(0, 3).toUpperCase();
          const anio = parseInt(m.slice(3), 10) || 0;
          return anio * 100 + (meses[mes] ?? 0);
        };
        return parseMs(a.mes) - parseMs(b.mes);
      });
  }

  /**
   * Top categories by CIF (using first 2 digits of partida_ar)
   */
  async topCategorias(limit = 8) {
    const result = await this.prisma.$queryRaw<
      {
        capitulo: string;
        total_cif: number;
        total_fob: number;
        registros: bigint;
      }[]
    >`
      SELECT
        LEFT(REGEXP_REPLACE(partida_ar, '[^0-9]', '', 'g'), 2) AS capitulo,
        SUM(cif_item) AS total_cif,
        SUM(fob) AS total_fob,
        COUNT(*) AS registros
      FROM "DeclaracionAduanera"
      WHERE partida_ar IS NOT NULL
      GROUP BY capitulo
      ORDER BY total_cif DESC
      LIMIT ${limit + 1}
    `;

    // Take top N and group the rest as "Otros"
    const top = result.slice(0, limit).map((r) => ({
      capitulo: r.capitulo,
      totalCif: Number(r.total_cif ?? 0),
      totalFob: Number(r.total_fob ?? 0),
      registros: Number(r.registros),
    }));

    if (result.length > limit) {
      const otros = result.slice(limit);
      top.push({
        capitulo: '99',
        totalCif: otros.reduce((s, r) => s + Number(r.total_cif ?? 0), 0),
        totalFob: otros.reduce((s, r) => s + Number(r.total_fob ?? 0), 0),
        registros: otros.reduce((s, r) => s + Number(r.registros), 0),
      });
    }

    return top;
  }

  /**
   * Generate Excel report with multiple sheets based on filters
   */
  async generarReporteExcel(filtros: {
    pais_orige?: string;
    importador?: string;
    proveedor?: string;
    descripcion?: string;
    partida_ar?: string;
    mes?: string;
    depto_des?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
  }): Promise<Buffer> {
    const where: Prisma.DeclaracionAduaneraWhereInput = {};

    if (filtros.pais_orige) {
      const paises = filtros.pais_orige
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (paises.length === 1) {
        where.pais_orige = { contains: paises[0], mode: 'insensitive' };
      } else if (paises.length > 1) {
        where.pais_orige = { in: paises };
      }
    }
    if (filtros.importador)
      where.importador = { contains: filtros.importador, mode: 'insensitive' };
    if (filtros.proveedor)
      where.proveedor = { contains: filtros.proveedor, mode: 'insensitive' };
    if (filtros.descripcion)
      where.descripcio = { contains: filtros.descripcion, mode: 'insensitive' };
    if (filtros.partida_ar)
      where.partida_ar = { startsWith: filtros.partida_ar };
    if (filtros.mes) where.mes = filtros.mes;
    if (filtros.depto_des) where.depto_des = filtros.depto_des;

    if (filtros.fecha_desde || filtros.fecha_hasta) {
      where.fecha_reci = {};
      if (filtros.fecha_desde)
        (where.fecha_reci as Prisma.DateTimeFilter).gte = filtros.fecha_desde;
      if (filtros.fecha_hasta)
        (where.fecha_reci as Prisma.DateTimeFilter).lte = filtros.fecha_hasta;
    }

    // Fetch all data needed for the report in parallel
    const [
      declaraciones,
      resumen,
      porMes,
      porImportador,
      porProveedor,
      porPaisOrigen,
      porPaisProcedencia,
      porPartida,
    ] = await Promise.all([
      // Detalle completo (limit to 10000 for performance)
      this.prisma.declaracionAduanera.findMany({
        where,
        take: 10000,
        orderBy: { fecha_reci: 'desc' },
      }),
      // Resumen general
      this.prisma.declaracionAduanera.aggregate({
        where,
        _sum: { cif_item: true, fob: true, p_neto: true, p_bruto: true },
        _count: true,
      }),
      // Por mes
      this.prisma.declaracionAduanera.groupBy({
        by: ['mes'],
        where: { ...where, mes: { not: null } },
        _sum: { cif_item: true, fob: true, p_neto: true },
        _count: true,
      }),
      // Por importador
      this.prisma.declaracionAduanera.groupBy({
        by: ['importador'],
        where: { ...where, importador: { not: null } },
        _sum: { cif_item: true, fob: true, p_neto: true },
        _count: true,
      }),
      // Por proveedor
      this.prisma.declaracionAduanera.groupBy({
        by: ['proveedor', 'pais_orige'],
        where: { ...where, proveedor: { not: null } },
        _sum: { cif_item: true, fob: true, p_neto: true },
        _count: true,
      }),
      // Por país de origen
      this.prisma.declaracionAduanera.groupBy({
        by: ['pais_orige'],
        where: { ...where, pais_orige: { not: null } },
        _sum: { cif_item: true, fob: true, p_neto: true },
        _count: true,
      }),
      // Por país de procedencia
      this.prisma.declaracionAduanera.groupBy({
        by: ['pais_pro'],
        where: { ...where, pais_pro: { not: null } },
        _sum: { cif_item: true, fob: true, p_neto: true },
        _count: true,
      }),
      // Por partida arancelaria
      this.prisma.declaracionAduanera.groupBy({
        by: ['partida_ar', 'descripcio'],
        where: { ...where, partida_ar: { not: null } },
        _sum: { cif_item: true, fob: true, p_neto: true },
        _count: true,
      }),
    ]);

    // Calculate totals for percentages
    const totalCif = Number(resumen._sum.cif_item ?? 0);
    const totalPesoNeto = Number(resumen._sum.p_neto ?? 0);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Helper to format numbers (accepts Decimal from Prisma)
    const fmt = (n: unknown) => (n != null ? Number(n) : 0);
    const pct = (n: number) =>
      totalCif > 0 ? ((n / totalCif) * 100).toFixed(2) + '%' : '0%';

    // Build filter description for headers
    const filterDesc = this.buildFilterDescription(filtros);
    const periodo = this.buildPeriodoDescription(filtros);

    // 1. ÍNDICE sheet
    const indiceData = [
      ['Índice de Reportes'],
      [filterDesc],
      [periodo],
      [''],
      ['', 'Haga click en los links debajo para ir directo al Reporte'],
      [''],
      ['', 'Montos', 'Montos importados cada mes'],
      ['', 'Posiciones', 'Listado de Posiciones importadas'],
      ['', 'Importadores', 'Listado de Importadores'],
      ['', 'Proveedores', 'Listado de Proveedores'],
      ['', 'Países de Origen', 'Origen de los productos importados'],
      ['', 'Países de Procedencia', 'Listado de Procedencias'],
      ['', 'Detalle Completo', 'Detalles de Operaciones'],
    ];
    const wsIndice = XLSX.utils.aoa_to_sheet(indiceData);
    XLSX.utils.book_append_sheet(workbook, wsIndice, 'Índice');

    // 2. MONTOS sheet (por mes)
    const montosHeader = [
      ['Reporte de Importaciones - Montos'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      ['Mes', 'Monto (USD)', 'Peso Neto', '%Monto'],
    ];
    const montosData = porMes
      .filter((r) => r.mes)
      .map((r) => [
        r.mes,
        fmt(r._sum.cif_item),
        fmt(r._sum.p_neto),
        pct(fmt(r._sum.cif_item)),
      ])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    montosData.push(['Total', totalCif, totalPesoNeto, '100%']);
    const wsMontosData = [...montosHeader, ...montosData];
    const wsMontos = XLSX.utils.aoa_to_sheet(wsMontosData);
    XLSX.utils.book_append_sheet(workbook, wsMontos, 'Montos');

    // 3. POSICIONES sheet (por partida)
    const posicionesHeader = [
      ['Reporte de Importaciones - Posiciones'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      ['Posición', 'Producto', 'Monto (USD)', 'Peso Neto', '%Monto'],
    ];
    const posicionesData = porPartida
      .filter((r) => r.partida_ar)
      .map((r) => [
        r.partida_ar,
        r.descripcio,
        fmt(r._sum.cif_item),
        fmt(r._sum.p_neto),
        pct(fmt(r._sum.cif_item)),
      ])
      .sort((a, b) => Number(b[2]) - Number(a[2]));
    posicionesData.push(['Total', '', totalCif, totalPesoNeto, '100%']);
    const wsPosicionesData = [...posicionesHeader, ...posicionesData];
    const wsPosiciones = XLSX.utils.aoa_to_sheet(wsPosicionesData);
    XLSX.utils.book_append_sheet(workbook, wsPosiciones, 'Posiciones');

    // 4. IMPORTADORES sheet
    const importadoresHeader = [
      ['Reporte de Importaciones - Empresas'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      ['Importador', 'Monto (USD)', 'Peso Neto', '%Monto'],
    ];
    const importadoresData = porImportador
      .filter((r) => r.importador)
      .map((r) => [
        r.importador,
        fmt(r._sum.cif_item),
        fmt(r._sum.p_neto),
        pct(fmt(r._sum.cif_item)),
      ])
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    importadoresData.push(['Total', totalCif, totalPesoNeto, '100%']);
    const wsImportadoresData = [...importadoresHeader, ...importadoresData];
    const wsImportadores = XLSX.utils.aoa_to_sheet(wsImportadoresData);
    XLSX.utils.book_append_sheet(workbook, wsImportadores, 'Importadores');

    // 5. PROVEEDORES sheet
    const proveedoresHeader = [
      ['Reporte de Importaciones - Proveedores'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      [
        'Proveedor',
        'País',
        'Operaciones',
        'Monto (USD)',
        'Peso Neto',
        '%Monto',
      ],
    ];
    const proveedoresData = porProveedor
      .filter((r) => r.proveedor)
      .map((r) => [
        r.proveedor,
        r.pais_orige ?? '',
        r._count,
        fmt(r._sum.cif_item),
        fmt(r._sum.p_neto),
        pct(fmt(r._sum.cif_item)),
      ])
      .sort((a, b) => Number(b[3]) - Number(a[3]));
    proveedoresData.push([
      'Total',
      '',
      resumen._count,
      totalCif,
      totalPesoNeto,
      '100%',
    ]);
    const wsProveedoresData = [...proveedoresHeader, ...proveedoresData];
    const wsProveedores = XLSX.utils.aoa_to_sheet(wsProveedoresData);
    XLSX.utils.book_append_sheet(workbook, wsProveedores, 'Proveedores');

    // 6. PAÍSES DE ORIGEN sheet
    const paisesOrigenHeader = [
      ['Reporte de Importaciones - Países de Origen'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      ['País', 'Monto (USD)', 'Peso Neto', '%Monto'],
    ];
    const paisesOrigenData = porPaisOrigen
      .filter((r) => r.pais_orige)
      .map((r) => [
        r.pais_orige,
        fmt(r._sum.cif_item),
        fmt(r._sum.p_neto),
        pct(fmt(r._sum.cif_item)),
      ])
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    paisesOrigenData.push(['Total', totalCif, totalPesoNeto, '100%']);
    const wsPaisesOrigenData = [...paisesOrigenHeader, ...paisesOrigenData];
    const wsPaisesOrigen = XLSX.utils.aoa_to_sheet(wsPaisesOrigenData);
    XLSX.utils.book_append_sheet(workbook, wsPaisesOrigen, 'Países de Origen');

    // 7. PAÍSES DE PROCEDENCIA sheet
    const paisesProcHeader = [
      ['Reporte de Importaciones - Países de Procedencia'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      ['País', 'Monto (USD)', 'Peso Neto', '%Monto'],
    ];
    const paisesProcData = porPaisProcedencia
      .filter((r) => r.pais_pro)
      .map((r) => [
        r.pais_pro,
        fmt(r._sum.cif_item),
        fmt(r._sum.p_neto),
        pct(fmt(r._sum.cif_item)),
      ])
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    paisesProcData.push(['Total', totalCif, totalPesoNeto, '100%']);
    const wsPaisesProcData = [...paisesProcHeader, ...paisesProcData];
    const wsPaisesProc = XLSX.utils.aoa_to_sheet(wsPaisesProcData);
    XLSX.utils.book_append_sheet(workbook, wsPaisesProc, 'Países Procedencia');

    // 8. DETALLE COMPLETO sheet
    const detalleHeader = [
      ['Reporte de Importaciones - Detalle Completo'],
      [filterDesc],
      [periodo],
      [''],
      ['[Ir al Índice]'],
      [''],
      [
        'Fecha',
        'Operación',
        'Posición',
        'Importador',
        'Proveedor',
        'Origen',
        'Procedencia',
        'Detalle',
        'Cantidad',
        'Unidad',
        'Monto (USD)',
        'Peso Neto',
        'Peso Bruto',
        'FOB (USD)',
        'Flete (USD)',
        'Seguro (USD)',
        'Aduana',
        'Departamento',
      ],
    ];
    const detalleData = declaraciones.map((d) => [
      d.fecha_reci ? new Date(d.fecha_reci).toLocaleDateString('es-BO') : '',
      d.nro_consec ?? '',
      d.partida_ar ?? '',
      d.importador ?? '',
      d.proveedor ?? '',
      d.pais_orige ?? '',
      d.pais_pro ?? '',
      d.descripcio ?? '',
      fmt(d.cantidad),
      d.unid_med ?? '',
      fmt(d.cif_item),
      fmt(d.p_neto),
      fmt(d.p_bruto),
      fmt(d.fob),
      fmt(d.flete_item),
      fmt(d.seg_item),
      d.aduana ?? '',
      d.depto_des ?? '',
    ]);
    // Add totals row
    detalleData.push([
      'Total',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      declaraciones.reduce((s, d) => s + fmt(d.cantidad), 0),
      '',
      totalCif,
      totalPesoNeto,
      Number(resumen._sum.p_bruto ?? 0),
      Number(resumen._sum.fob ?? 0),
      declaraciones.reduce((s, d) => s + fmt(d.flete_item), 0),
      declaraciones.reduce((s, d) => s + fmt(d.seg_item), 0),
      '',
      '',
    ]);
    const wsDetalleData = [...detalleHeader, ...detalleData];
    const wsDetalle = XLSX.utils.aoa_to_sheet(wsDetalleData);
    XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Detalle Completo');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  private buildFilterDescription(filtros: {
    pais_orige?: string;
    importador?: string;
    proveedor?: string;
    descripcion?: string;
    partida_ar?: string;
    depto_des?: string;
  }): string {
    const parts: string[] = [];
    if (filtros.partida_ar) parts.push(filtros.partida_ar);
    if (filtros.descripcion) parts.push(filtros.descripcion.toUpperCase());
    if (filtros.importador) parts.push(filtros.importador.toUpperCase());
    if (filtros.proveedor) parts.push(`Proveedor: ${filtros.proveedor}`);
    if (filtros.pais_orige) parts.push(`Origen: ${filtros.pais_orige}`);
    if (filtros.depto_des) parts.push(`Depto: ${filtros.depto_des}`);
    return parts.length > 0 ? parts.join(' - ') : 'Todos los registros';
  }

  private buildPeriodoDescription(filtros: {
    fecha_desde?: Date;
    fecha_hasta?: Date;
    mes?: string;
  }): string {
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      const desde = filtros.fecha_desde.toLocaleDateString('es-BO');
      const hasta = filtros.fecha_hasta.toLocaleDateString('es-BO');
      return `del ${desde} al ${hasta}`;
    }
    if (filtros.mes) {
      return `Mes: ${filtros.mes}`;
    }
    return 'Todos los períodos';
  }

  /**
   * Build filename for the Excel report
   */
  buildReportFilename(filtros: {
    pais_orige?: string;
    importador?: string;
    partida_ar?: string;
    descripcion?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
  }): string {
    const parts: string[] = ['BO', 'IMP'];

    // Add date range
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}${m}`;
      };
      parts.push(
        `${formatDate(filtros.fecha_desde)} al ${formatDate(filtros.fecha_hasta)}`,
      );
    } else {
      parts.push(new Date().getFullYear().toString());
    }

    // Add partida or description
    if (filtros.partida_ar) {
      parts.push(filtros.partida_ar.replace(/\./g, ''));
    }
    if (filtros.descripcion) {
      parts.push(filtros.descripcion.slice(0, 30).toUpperCase());
    } else if (filtros.importador) {
      parts.push(filtros.importador.slice(0, 30).toUpperCase());
    }

    return parts.join(' - ') + '.xlsx';
  }
}
