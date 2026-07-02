import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEstacionamientoServicioDto {
  @IsNumber()
  @IsNotEmpty()
  id_estacionamiento: number;

  @IsNumber()
  @IsNotEmpty()
  id_servicio: number;
}
