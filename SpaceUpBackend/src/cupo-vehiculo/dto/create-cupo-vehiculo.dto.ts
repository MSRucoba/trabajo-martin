import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateCupoVehiculoDto {
  @IsString()
  tipo_vehiculo: string;

  @IsInt()
  @Min(0)
  cupos_totales: number;
}
