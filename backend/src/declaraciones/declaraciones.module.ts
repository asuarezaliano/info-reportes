import { Module } from '@nestjs/common';
import { DeclaracionesController } from './declaraciones.controller';
import { DeclaracionesService } from './declaraciones.service';

@Module({
  controllers: [DeclaracionesController],
  providers: [DeclaracionesService],
  exports: [DeclaracionesService],
})
export class DeclaracionesModule {}
