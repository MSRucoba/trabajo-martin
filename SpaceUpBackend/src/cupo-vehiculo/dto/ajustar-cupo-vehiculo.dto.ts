import { IsInt, IsString } from 'class-validator';

export class AjustarCupoVehiculoDto {
  @IsString()
  tipo_vehiculo: string;

  @IsInt()
  cambio: number;
}
