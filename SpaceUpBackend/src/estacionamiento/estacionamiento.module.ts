import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstacionamientoService } from './estacionamiento.service';
import { EstacionamientoController } from './estacionamiento.controller';
import { Estacionamiento } from './estacionamiento.entity';
import { Empresa } from '../empresa/empresa.entity';
import { CupoVehiculo } from '../cupo-vehiculo/cupo-vehiculo.entity';
import { Tarifa } from '../tarifa/tarifa.entity';
import { EstacionamientoServicio } from '../estacionamiento-servicio/estacionamiento-servicio.entity';
import { ImagenEstacionamiento } from '../imagen-estacionamiento/imagen-estacionamiento.entity';
import { EmpleadoEmpresa } from '../empleado-empresa/empleado-empresa.entity';
import { Servicio } from '../servicio/servicio.entity';
import { Usuario } from '../usuario/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Estacionamiento,
      Empresa,
      CupoVehiculo,
      Tarifa,
      EstacionamientoServicio,
      ImagenEstacionamiento,
      Servicio,
      Usuario,
      EmpleadoEmpresa,
    ]),
  ],
  controllers: [EstacionamientoController],
  providers: [EstacionamientoService],
  exports: [EstacionamientoService],
})
export class EstacionamientoModule {}
