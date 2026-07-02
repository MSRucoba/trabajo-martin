import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  nombre: string;
}
