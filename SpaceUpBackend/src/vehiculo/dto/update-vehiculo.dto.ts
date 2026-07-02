import {
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VehiculoEstado } from '../enums/vehiculo-estados.enum';

export class UpdateVehiculoDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID del tipo de vehículo debe ser un número' })
  idTipoVehiculo?: number;

  @IsOptional()
  @IsString({ message: 'La placa debe ser un texto' })
  @MinLength(6, { message: 'La placa debe tener al menos 6 caracteres' })
  @MaxLength(10, { message: 'La placa no puede tener más de 10 caracteres' })
  @Matches(/^[A-Z0-9-]+$/, {
    message:
      'La placa solo puede contener letras mayúsculas, números y guiones',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  placa?: string;
  @IsOptional()
  @IsString({ message: 'El apodo debe ser un texto' })
  @MaxLength(50, { message: 'El apodo no puede tener más de 50 caracteres' })
  apodo?: string;
  @IsOptional()
  @IsEnum(VehiculoEstado, {
    message: 'El estado debe ser "activo" o "inactivo"',
  })
  estado?: VehiculoEstado;
}
