import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CupoVehiculo } from './cupo-vehiculo.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { UpdateCupoVehiculoDto } from './dto/update-cupo-vehiculo.dto';
import { AjustarCupoVehiculoDto } from './dto/ajustar-cupo-vehiculo.dto';

@Injectable()
export class CupoVehiculoService {
  constructor(
    @InjectRepository(CupoVehiculo)
    private readonly cupoVehiculoRepository: Repository<CupoVehiculo>,

    @InjectRepository(Estacionamiento)
    private readonly estacionamientoRepository: Repository<Estacionamiento>,
  ) {}

  async findByEstacionamiento(
    idEstacionamiento: number,
  ): Promise<CupoVehiculo[]> {
    return await this.cupoVehiculoRepository.find({
      where: { estacionamiento: { id_estacionamiento: idEstacionamiento } },
    });
  }

  async findOne(id: number): Promise<CupoVehiculo> {
    const cupo = await this.cupoVehiculoRepository.findOne({
      where: { id_cupo_vehiculo: id },
      relations: ['estacionamiento'],
    });
    if (!cupo) {
      throw new NotFoundException(`Cupo con id ${id} no encontrado`);
    }
    return cupo;
  }

  async update(id: number, dto: UpdateCupoVehiculoDto): Promise<CupoVehiculo> {
    const cupo = await this.findOne(id);

    if (dto.cupos_totales !== undefined) {
      if (dto.cupos_totales < 0) {
        throw new BadRequestException(
          'Los cupos totales no pueden ser negativos',
        );
      }
      if (dto.cupos_totales < cupo.cupos_disponibles) {
        cupo.cupos_disponibles = dto.cupos_totales;
      }
    }

    Object.assign(cupo, dto);
    const cupoActualizado = await this.cupoVehiculoRepository.save(cupo);

    // Recalcular totales del estacionamiento
    await this.recalcularCuposEstacionamiento(
      cupo.estacionamiento.id_estacionamiento,
    );

    return cupoActualizado;
  }

  async ajustar(
    idEstacionamiento: number,
    dto: AjustarCupoVehiculoDto,
  ): Promise<CupoVehiculo> {
    const cupo = await this.cupoVehiculoRepository.findOne({
      where: {
        estacionamiento: { id_estacionamiento: idEstacionamiento },
        tipo_vehiculo: dto.tipo_vehiculo,
      },
    });

    if (!cupo) {
      throw new NotFoundException(
        `No se encontró cupo para tipo ${dto.tipo_vehiculo} en estacionamiento ${idEstacionamiento}`,
      );
    }

    const nuevoDisponible = cupo.cupos_disponibles + dto.cambio;

    if (nuevoDisponible < 0) {
      throw new BadRequestException('No hay cupos disponibles suficientes');
    }
    if (nuevoDisponible > cupo.cupos_totales) {
      throw new BadRequestException(
        'Los cupos disponibles no pueden superar los totales',
      );
    }

    cupo.cupos_disponibles = nuevoDisponible;
    const cupoActualizado = await this.cupoVehiculoRepository.save(cupo);

    await this.recalcularCuposEstacionamiento(idEstacionamiento);

    return cupoActualizado;
  }

  private async recalcularCuposEstacionamiento(
    idEstacionamiento: number,
  ): Promise<void> {
    const cupos = await this.cupoVehiculoRepository.find({
      where: { estacionamiento: { id_estacionamiento: idEstacionamiento } },
    });

    const totales = cupos.reduce((sum, c) => sum + c.cupos_totales, 0);
    const disponibles = cupos.reduce((sum, c) => sum + c.cupos_disponibles, 0);

    await this.estacionamientoRepository.update(idEstacionamiento, {
      cupos_totales: totales,
      cupos_disponibles: disponibles,
    });
  }

  async verificarDisponibilidad(
    idEstacionamiento: number,
    tipoVehiculo: string,
  ): Promise<{ disponible: boolean; cupos: number }> {
    const cupo = await this.cupoVehiculoRepository.findOne({
      where: {
        estacionamiento: { id_estacionamiento: idEstacionamiento },
        tipo_vehiculo: tipoVehiculo,
        activo: true,
      },
    });

    if (!cupo) {
      return { disponible: false, cupos: 0 };
    }

    return {
      disponible: cupo.cupos_disponibles > 0,
      cupos: cupo.cupos_disponibles,
    };
  }

  async remove(id: number): Promise<void> {
    const cupo = await this.findOne(id);
    const idEstacionamiento = cupo.estacionamiento.id_estacionamiento;

    const result = await this.cupoVehiculoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Cupo con id ${id} no encontrado`);
    }

    // Recalcular después de eliminar
    await this.recalcularCuposEstacionamiento(idEstacionamiento);
  }
}
