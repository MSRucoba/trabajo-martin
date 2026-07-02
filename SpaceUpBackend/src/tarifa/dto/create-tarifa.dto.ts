import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { TipoTarifa } from '../tipo-tarifa.enum';

export class CreateTarifaDto {
  @IsString()
  @IsNotEmpty()
  tipo_vehiculo: string;

  @IsEnum(TipoTarifa)
  @IsNotEmpty()
  tipo_tarifa: TipoTarifa;

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsNumber()
  @IsNotEmpty()
  id_estacionamiento: number;
}
