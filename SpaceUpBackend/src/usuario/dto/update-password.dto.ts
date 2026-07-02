import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6, {
    message: 'La contraseña actual debe tener al menos 6 caracteres',
  })
  currentPassword: string;

  @IsString()
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;
}
