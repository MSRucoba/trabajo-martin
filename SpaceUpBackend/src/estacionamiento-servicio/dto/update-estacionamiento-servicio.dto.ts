import { PartialType } from '@nestjs/mapped-types';
import { CreateEstacionamientoServicioDto } from './create-estacionamiento-servicio.dto';

export class UpdateEstacionamientoServicioDto extends PartialType(
  CreateEstacionamientoServicioDto,
) {}
