import { IsString, IsNotEmpty, Length, IsNumber } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  nombre_empresa: string;

  @IsString()
  @IsNotEmpty()
  @Length(11, 20)
  ruc: string;

  @IsString()
  @Length(6, 20)
  numero_contacto: string;

  @IsNumber()
  @IsNotEmpty()
  id_usuario: number;
}
