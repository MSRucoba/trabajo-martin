import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoVehiculo } from './tipo-vehiculo.entity';
import { TipoVehiculoService } from './tipo-vehiculo.service';
import { TipoVehiculoController } from './tipo-vehiculo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoVehiculo])],
  controllers: [TipoVehiculoController],
  providers: [TipoVehiculoService],
})
export class TipoVehiculoModule {}
