import {
  IsEmail,
  IsNotEmpty,
  Length,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateEncargadoDto {
  @IsNotEmpty()
  @Length(3, 100)
  nombre: string;

  @IsNotEmpty()
  @Length(3, 100)
  apellido: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  @IsOptional()
  @Length(6, 20)
  phone?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Debe especificar el estacionamiento' })
  id_estacionamiento: number;
}
