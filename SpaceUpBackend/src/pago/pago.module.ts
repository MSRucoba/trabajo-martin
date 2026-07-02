import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';
import { Pago } from './pago.entity';
import { Reserva } from '../reserva/reserva.entity';
import { StripeService } from '../util/stripe.service';
import { BilleteraPago } from '../billetera-pago/billetera-pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Reserva, BilleteraPago]),
    ConfigModule,
  ],
  controllers: [PagoController],
  providers: [PagoService, StripeService],
  exports: [PagoService],
})
export class PagoModule {}
