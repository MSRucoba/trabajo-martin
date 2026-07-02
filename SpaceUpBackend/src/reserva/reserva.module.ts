import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservaController } from './reserva.controller';
import { ReservaService } from './reserva.service';
import { ReservaCronService } from './reserva-cron.service';
import { Reserva } from './reserva.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { Vehiculo } from '../vehiculo/vehiculo.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Tarifa } from '../tarifa/tarifa.entity';
import { TipoVehiculo } from '../tipo-vehiculo/tipo-vehiculo.entity';
import { PagoModule } from '../pago/pago.module';
import { CupoVehiculo } from 'src/cupo-vehiculo/cupo-vehiculo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      Estacionamiento,
      Vehiculo,
      Usuario,
      Tarifa,
      TipoVehiculo,
      CupoVehiculo,
    ]),
    forwardRef(() => PagoModule),
  ],
  controllers: [ReservaController],
  providers: [ReservaService, ReservaCronService],
  exports: [ReservaService],
})
export class ReservaModule {}
