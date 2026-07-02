import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateEmpleadoEmpresaDto {
  @IsOptional()
  @IsString()
  @Length(3, 20)
  estado?: string;
}
