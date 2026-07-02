import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../usuario/user-role.enum';

export class RegisterAuthDto {
  @IsOptional()
  @Length(8, 11)
  dni?: string;

  @IsOptional()
  @Length(11, 11)
  ruc?: string;

  @IsOptional()
  @Length(2, 255)
  apellido?: string;

  @IsOptional()
  imagenPerfil?: string;

  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  @IsOptional()
  @Length(6, 20)
  numero_contacto?: string;

  @IsOptional()
  @Length(6, 20)
  phone?: string;

  @IsOptional()
  @Length(2, 255)
  nombre?: string;
}
