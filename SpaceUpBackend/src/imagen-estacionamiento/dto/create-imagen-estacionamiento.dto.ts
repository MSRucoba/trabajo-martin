import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImagenTipo } from '../imagen-tipo.enum';

export class CreateImagenEstacionamientoDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id_estacionamiento: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsNotEmpty()
  @IsEnum(ImagenTipo, { message: 'El tipo debe ser PERFIL o GALERIA' })
  tipo: ImagenTipo;
}
