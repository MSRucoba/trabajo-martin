import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePagoDto {
  @IsNotEmpty({ message: 'ID de reserva requerido' })
  @IsNumber({}, { message: 'ID debe ser numérico' })
  id_reserva: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto inválido' })
  @Min(0.01, { message: 'Monto mínimo 0.01 MXN (solo test)' })
  monto: number;
}

export class UpdatePagoDto {
  @IsOptional()
  @IsString()
  mensajeError?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
