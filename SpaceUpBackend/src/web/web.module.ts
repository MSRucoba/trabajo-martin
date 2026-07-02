import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/usuario.entity';
import { Empresa } from 'src/empresa/empresa.entity';
import { Estacionamiento } from 'src/estacionamiento/estacionamiento.entity';
import { Reserva } from 'src/reserva/reserva.entity';
import { Pago } from 'src/pago/pago.entity';
import { TipoVehiculo } from 'src/tipo-vehiculo/tipo-vehiculo.entity';
import { Servicio } from 'src/servicio/servicio.entity';
import { Vehiculo } from 'src/vehiculo/vehiculo.entity';
import { EstacionamientoServicio } from 'src/estacionamiento-servicio/estacionamiento-servicio.entity';
import { EmpleadoEmpresa } from 'src/empleado-empresa/empleado-empresa.entity';

import { DashboardWebService } from './dashboard-web.service';
import { DashboardWebController } from './dashboard-web.controller';
import { EmpresasWebService } from './empresas-web.service';
import { EmpresasWebController } from './empresas-web.controller';
import { EstacionamientosWebService } from './estacionamientos-web.service';
import { EstacionamientosWebController } from './estacionamientos-web.controller';
import { UsuariosWebService } from './usuarios-web.service';
import { UsuariosWebController } from './usuarios-web.controller';
import { ReservasWebService } from './reserva-web.service';
import { ReservasWebController } from './reserva-web.controller';
import { PagosWebService } from './pago-web.service';
import { PagosWebController } from './pago-web.controller';
import { TiposServiciosWebService } from './tipos-servicios-web.service';
import { TiposServiciosWebController } from './tipos-servicios-web.controller';
import { LogsController } from './logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Empresa,
      Estacionamiento,
      Reserva,
      Pago,
      TipoVehiculo,
      Servicio,
      Vehiculo,
      EstacionamientoServicio,
      EmpleadoEmpresa,
    ]),
  ],
  controllers: [
    DashboardWebController,
    EmpresasWebController,
    EstacionamientosWebController,
    UsuariosWebController,
    ReservasWebController,
    PagosWebController,
    TiposServiciosWebController,
    LogsController,
  ],
  providers: [
    DashboardWebService,
    EmpresasWebService,
    EstacionamientosWebService,
    UsuariosWebService,
    ReservasWebService,
    PagosWebService,
    TiposServiciosWebService,
  ],
})
export class WebModule {}
