import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpleadoEmpresa } from './empleado-empresa.entity';
import { EmpleadoEmpresaService } from './empleado-empresa.service';
import { EmpleadoEmpresaController } from './empleado-empresa.controller';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EstacionamientoModule } from '../estacionamiento/estacionamiento.module';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpleadoEmpresa,
      Empresa,
      Usuario,
      Estacionamiento,
    ]),
    EstacionamientoModule,
  ],
  controllers: [EmpleadoEmpresaController],
  providers: [EmpleadoEmpresaService],
  exports: [EmpleadoEmpresaService],
})
export class EmpleadoEmpresaModule {}
