import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateEmpleadoEmpresaDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Debe especificar la empresa' })
  id_empresa: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Debe especificar el usuario' })
  id_usuario: number;

  @IsOptional()
  @IsString()
  @Length(3, 20)
  estado?: string;
}
