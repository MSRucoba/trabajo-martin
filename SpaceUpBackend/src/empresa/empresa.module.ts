import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './empresa.entity';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { SunatModule } from './sunat.module';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa]), SunatModule],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService],
})
export class EmpresaModule {}
