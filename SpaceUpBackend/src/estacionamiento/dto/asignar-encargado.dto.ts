import { IsNumber, IsOptional } from 'class-validator';

export class AsignarEncargadoDto {
  @IsOptional()
  @IsNumber()
  id_encargado?: number;
}
