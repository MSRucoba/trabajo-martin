import {
  IsString,
  IsOptional,
  IsNumber,
  Length,
  IsBoolean,
  Matches,
  IsArray,
} from 'class-validator';

export class UpdateEstacionamientoDto {
  @IsOptional()
  @IsString()
  @Length(3, 100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(5, 255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @Length(9, 15)
  telefono?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Debe proporcionar un valor numérico para latitud' })
  latitud?: number;

  @IsOptional()
  @IsNumber(
    {},
    { message: 'Debe proporcionar un valor numérico para longitud' },
  )
  longitud?: number;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Debe usar formato HH:mm o HH:mm:ss',
  })
  hora_apertura?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Debe usar formato HH:mm o HH:mm:ss',
  })
  hora_cierre?: string;

  @IsOptional()
  @IsBoolean()
  es24h?: boolean;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsNumber()
  id_encargado?: number;
  @IsOptional()
  @IsString()
  imagen_perfil?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes_galeria?: string[];
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  servicios?: number[];
}
