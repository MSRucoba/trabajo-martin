import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculoService } from './vehiculo.service';
import { VehiculoController } from './vehiculo.controller';
import { Vehiculo } from './vehiculo.entity';
import { Usuario } from '../usuario/usuario.entity';
import { TipoVehiculo } from '../tipo-vehiculo/tipo-vehiculo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Usuario, TipoVehiculo])],
  controllers: [VehiculoController],
  providers: [VehiculoService],
  exports: [VehiculoService],
})
export class VehiculoModule {}
