import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(9, 9, { message: 'El teléfono debe tener exactamente 9 dígitos' })
  phone?: string;
}
