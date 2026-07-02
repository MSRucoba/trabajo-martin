import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Length,
  IsBoolean,
  IsMilitaryTime,
  ValidateIf,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCupoVehiculoDto } from '../../cupo-vehiculo/dto/create-cupo-vehiculo.dto';
import { TipoTarifa } from '../../tarifa/tipo-tarifa.enum';

export class CreateTarifaNestedDto {
  @IsString()
  @IsNotEmpty()
  tipo_vehiculo: string;

  @IsEnum(TipoTarifa)
  @IsNotEmpty()
  tipo_tarifa: TipoTarifa;

  @IsNumber()
  @IsNotEmpty()
  monto: number;
}

export class CreateEstacionamientoDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  nombre: string;

  @IsString()
  @Length(5, 255)
  direccion: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  descripcion?: string;

  @IsNumber({}, { message: 'Debe proporcionar la latitud' })
  latitud: number;

  @IsNumber({}, { message: 'Debe proporcionar la longitud' })
  longitud: number;
  @IsNumber()
  @IsNotEmpty({ message: 'Debe indicar la empresa dueña del estacionamiento' })
  id_empresa: number;

  @IsNumber()
  @IsOptional()
  id_encargado_asignado?: number;

  @ValidateIf((obj) => !obj.es24h)
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Debe usar formato HH:mm o HH:mm:ss',
  })
  @IsNotEmpty({ message: 'Debe ingresar la hora de apertura' })
  hora_apertura: string;

  @ValidateIf((obj) => !obj.es24h)
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Debe usar formato HH:mm o HH:mm:ss',
  })
  @IsNotEmpty({ message: 'Debe ingresar la hora de cierre' })
  hora_cierre: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'Debe indicar si es 24h o no' })
  es24h: boolean;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe especificar al menos un tipo de cupo' })
  @ValidateNested({ each: true })
  @Type(() => CreateCupoVehiculoDto)
  cupos_vehiculo: CreateCupoVehiculoDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe especificar al menos una tarifa' })
  @ValidateNested({ each: true })
  @Type(() => CreateTarifaNestedDto)
  tarifas: CreateTarifaNestedDto[];

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  servicios?: number[];

  @IsString()
  @IsOptional()
  imagen_perfil?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  imagenes_galeria?: string[];

  @IsString()
  @IsOptional()
  @Length(9, 15)
  telefono?: string;
}
