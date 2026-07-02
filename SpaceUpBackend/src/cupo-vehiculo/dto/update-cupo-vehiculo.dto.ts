import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCupoVehiculoDto {
  @IsOptional()
  @IsString()
  tipo_vehiculo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cupos_totales?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
