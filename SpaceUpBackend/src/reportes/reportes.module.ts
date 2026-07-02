import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { Empresa } from '../empresa/empresa.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { Pago } from '../pago/pago.entity';
import { Reserva } from '../reserva/reserva.entity';
import { Usuario } from '../usuario/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empresa,
      Estacionamiento,
      Pago,
      Reserva,
      Usuario,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService, PdfGeneratorService],
  exports: [ReportesService],
})
export class ReportesModule {}
