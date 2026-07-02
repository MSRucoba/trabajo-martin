import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstacionamientoServicio } from './estacionamiento-servicio.entity';
import { EstacionamientoServicioService } from './estacionamiento-servicio.service';
import { EstacionamientoServicioController } from './estacionamiento-servicio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstacionamientoServicio])],
  controllers: [EstacionamientoServicioController],
  providers: [EstacionamientoServicioService],
  exports: [EstacionamientoServicioService],
})
export class EstacionamientoServicioModule {}
