import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum TipoVista {
  EMPRESAS = 'empresas',
  ESTACIONAMIENTOS = 'estacionamientos',
  PAGOS = 'pagos',
  RESERVAS = 'reservas',
  USUARIOS = 'usuarios',
}

export class GenerarReporteDto {
  @IsEnum(TipoVista)
  vista: TipoVista;

  @IsString()
  tipoReporte: string;

  @IsOptional()
  @IsObject()
  filtros?: any;
}
