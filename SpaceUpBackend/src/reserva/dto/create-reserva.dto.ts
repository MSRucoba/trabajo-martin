import {
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsString,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReservaDto {
  @IsInt()
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  id_usuario: number;

  @IsInt()
  @IsNotEmpty({ message: 'El ID del estacionamiento es obligatorio' })
  id_estacionamiento: number;

  @IsInt()
  @IsNotEmpty({ message: 'El ID del vehículo es obligatorio' })
  id_vehiculo: number;

  @IsDateString()
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @Transform(({ value }) => new Date(value).toISOString())
  fechaInicio: string;

  @IsDateString()
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  @Transform(({ value }) => new Date(value).toISOString())
  fechaFin: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || 'HORA')
  tipo_tarifa?: string;
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  cantidad?: number;
}
