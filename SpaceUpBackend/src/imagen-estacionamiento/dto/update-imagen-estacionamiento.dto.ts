import { PartialType } from '@nestjs/mapped-types';
import { CreateImagenEstacionamientoDto } from './create-imagen-estacionamiento.dto';

export class UpdateImagenEstacionamientoDto extends PartialType(
  CreateImagenEstacionamientoDto,
) {}
