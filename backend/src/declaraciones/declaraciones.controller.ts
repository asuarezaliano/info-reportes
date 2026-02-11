import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeclaracionesService } from './declaraciones.service';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const UPLOAD_DIR = join(process.cwd(), 'tmp', 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('declaraciones')
export class DeclaracionesController {
  constructor(private readonly declaracionesService: DeclaracionesService) {}

  @Post('importar')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${suffix}${extname(file.originalname || '')}`);
        },
      }),
      limits: {
        // 1GB
        fileSize: 1024 * 1024 * 1024,
      },
    }),
  )
  async importar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 })], // 1GB
        fileIsRequired: true,
      }),
    )
    archivo: { path: string; mimetype?: string; originalname?: string },
    @Query('delimiter') delimiter?: string,
  ) {
    const esExcel =
      archivo.mimetype?.includes('spreadsheet') ||
      archivo.mimetype?.includes('excel') ||
      /.xlsx?$/i.test(archivo.originalname || '');

    if (esExcel) {
      return this.declaracionesService.importarArchivoDesdeDisco(
        archivo.path,
        'excel',
      );
    }

    const delim =
      delimiter === 'comma'
        ? ','
        : delimiter === 'semicolon'
          ? ';'
          : delimiter === 'tab'
            ? '\t'
            : '';
    return this.declaracionesService.importarArchivoDesdeDisco(
      archivo.path,
      'csv',
      delim,
    );
  }

  @Get()
  async listar(
    @Query('pais_orige') pais_orige?: string,
    @Query('importador') importador?: string,
    @Query('proveedor') proveedor?: string,
    @Query('descripcion') descripcion?: string,
    @Query('partida_ar') partida_ar?: string,
    @Query('mes') mes?: string,
    @Query('depto_des') depto_des?: string,
    @Query('busqueda') busqueda?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.declaracionesService.listar({
      pais_orige,
      importador,
      proveedor,
      descripcion,
      partida_ar,
      mes,
      depto_des,
      busqueda,
      fecha_desde: fecha_desde ? new Date(fecha_desde) : undefined,
      fecha_hasta: fecha_hasta ? new Date(fecha_hasta) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('reportes/por-pais')
  async reportePorPais(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    return this.declaracionesService.reportePorPais({
      mes,
      anio: anio ? parseInt(anio, 10) : undefined,
    });
  }

  @Get('reportes/por-importador')
  async reportePorImportador(
    @Query('mes') mes?: string,
    @Query('limit') limit?: string,
  ) {
    return this.declaracionesService.reportePorImportador({
      mes,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('reportes/por-departamento')
  async reportePorDepartamento(@Query('mes') mes?: string) {
    return this.declaracionesService.reportePorDepartamento({ mes });
  }

  @Get('reportes/resumen')
  async resumenGeneral(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    return this.declaracionesService.resumenGeneral({
      mes,
      anio: anio ? parseInt(anio, 10) : undefined,
    });
  }
}
