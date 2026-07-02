import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(8, 15)
  dni: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Length(6, 15)
  phone?: string;

  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  @IsEnum(UserRole)
  rol: UserRole;
}
