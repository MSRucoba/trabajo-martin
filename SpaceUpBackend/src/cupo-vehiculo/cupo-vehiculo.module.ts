import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CupoVehiculoService } from './cupo-vehiculo.service';
import { CupoVehiculoController } from './cupo-vehiculo.controller';
import { CupoVehiculo } from './cupo-vehiculo.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CupoVehiculo, Estacionamiento])],
  controllers: [CupoVehiculoController],
  providers: [CupoVehiculoService],
  exports: [CupoVehiculoService],
})
export class CupoVehiculoModule {}
