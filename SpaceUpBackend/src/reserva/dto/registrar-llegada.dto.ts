import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class RegistrarLlegadaDto {
  @IsInt()
  id_reserva: number;

  @IsOptional()
  @IsBoolean()
  adelantar_horario?: boolean;
}
