import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoReserva } from '../enums/estado-reserva.enum';

export class UpdateReservaDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : value))
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : value))
  fechaFin?: string;

  @IsOptional()
  @IsEnum(EstadoReserva, { message: 'El estado no es válido' })
  estado?: EstadoReserva;
}
