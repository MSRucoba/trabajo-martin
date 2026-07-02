import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BilleteraPago } from './billetera-pago.entity';
import { BilleteraPagoService } from './billetera-pago.service';
import { BilleteraPagoController } from './billetera-pago.controller';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { StripeService } from '../util/stripe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BilleteraPago, Usuario]),
    UsuarioModule,
    ConfigModule,
  ],
  providers: [BilleteraPagoService, StripeService],
  controllers: [BilleteraPagoController],
  exports: [BilleteraPagoService],
})
export class BilleteraPagoModule {}
