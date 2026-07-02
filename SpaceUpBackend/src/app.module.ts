import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioModule } from './usuario/usuario.module';
import { VehiculoModule } from './vehiculo/vehiculo.module';
import { TipoVehiculoModule } from './tipo-vehiculo/tipo-vehiculo.module';
import { ReservaModule } from './reserva/reserva.module';
import { PagoModule } from './pago/pago.module';
import { EmpresaModule } from './empresa/empresa.module';
import { TarifaModule } from './tarifa/tarifa.module';
import { ServicioModule } from './servicio/servicio.module';
import { EstacionamientoServicioModule } from './estacionamiento-servicio/estacionamiento-servicio.module';
import { EstacionamientoModule } from './estacionamiento/estacionamiento.module';
import { ImagenEstacionamientoModule } from './imagen-estacionamiento/imagen-estacionamiento.module';
import { AuthModule } from './auth/auth.module';
import { BilleteraPagoModule } from './billetera-pago/billetera-pago.module';
import { EmpleadoEmpresaModule } from './empleado-empresa/empleado-empresa.module';
import { CupoVehiculoModule } from './cupo-vehiculo/cupo-vehiculo.module';
import { ReportesModule } from './reportes/reportes.module';
import { WebModule } from './web/web.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    UsuarioModule,
    VehiculoModule,
    TipoVehiculoModule,
    ReservaModule,
    PagoModule,
    EmpresaModule,
    TarifaModule,
    ServicioModule,
    EstacionamientoServicioModule,
    EstacionamientoModule,
    ImagenEstacionamientoModule,
    AuthModule,
    BilleteraPagoModule,
    EmpleadoEmpresaModule,
    CupoVehiculoModule,
    ReportesModule,
    WebModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
