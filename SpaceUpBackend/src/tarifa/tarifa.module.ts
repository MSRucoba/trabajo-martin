import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarifa } from './tarifa.entity';
import { TarifaService } from './tarifa.service';
import { TarifaController } from './tarifa.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tarifa])],
  controllers: [TarifaController],
  providers: [TarifaService],
  exports: [TarifaService],
})
export class TarifaModule {}
