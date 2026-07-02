import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoVehiculo } from './tipo-vehiculo.entity';
import { CreateTipoVehiculoDto } from './dto/create-tipo-vehiculo.dto';
import { UpdateTipoVehiculoDto } from './dto/update-tipo-vehiculo.dto';

@Injectable()
export class TipoVehiculoService {
  constructor(
    @InjectRepository(TipoVehiculo)
    private tipoVehiculoRepo: Repository<TipoVehiculo>,
  ) {}

  async create(dto: CreateTipoVehiculoDto): Promise<TipoVehiculo> {
    try {
      const nombreNormalizado = dto.nombre.trim().toUpperCase();

      const tipoExistente = await this.tipoVehiculoRepo.findOne({
        where: { nombre: nombreNormalizado },
      });

      if (tipoExistente) {
        throw new ConflictException(
          `Ya existe un tipo de vehículo con el nombre "${dto.nombre}"`,
        );
      }

      const tipo = this.tipoVehiculoRepo.create({ nombre: nombreNormalizado });
      return await this.tipoVehiculoRepo.save(tipo);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException(
        'Error al crear el tipo de vehículo',
      );
    }
  }

  async findAll(): Promise<TipoVehiculo[]> {
    return this.tipoVehiculoRepo.find({
      order: { nombre: 'ASC' },
      relations: ['vehiculos'],
    });
  }

  async findOne(id: number): Promise<TipoVehiculo> {
    const tipo = await this.tipoVehiculoRepo.findOne({
      where: { id },
      relations: ['vehiculos'],
    });

    if (!tipo) {
      throw new NotFoundException(
        `Tipo de vehículo con ID ${id} no encontrado`,
      );
    }
    return tipo;
  }

  async update(id: number, dto: UpdateTipoVehiculoDto): Promise<TipoVehiculo> {
    const tipo = await this.findOne(id);

    if (dto.nombre && dto.nombre.trim().toUpperCase() !== tipo.nombre) {
      const nombreNormalizado = dto.nombre.trim().toUpperCase();

      const nombreExistente = await this.tipoVehiculoRepo.findOne({
        where: { nombre: nombreNormalizado },
      });

      if (nombreExistente) {
        throw new ConflictException(
          `Ya existe un tipo de vehículo con el nombre "${dto.nombre}"`,
        );
      }

      dto.nombre = nombreNormalizado;
    }

    const actualizado = await this.tipoVehiculoRepo.preload({
      id,
      ...dto,
    });

    if (!actualizado) {
      throw new NotFoundException(
        `Tipo de vehículo con ID ${id} no encontrado para actualizar`,
      );
    }

    return this.tipoVehiculoRepo.save(actualizado);
  }

  async remove(id: number): Promise<void> {
    const tipo = await this.findOne(id);

    if (tipo.vehiculos && tipo.vehiculos.length > 0) {
      throw new ConflictException(
        `No se puede eliminar el tipo de vehículo porque tiene ${tipo.vehiculos.length} vehículo(s) asociado(s)`,
      );
    }

    const result = await this.tipoVehiculoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Error al eliminar tipo de vehículo con ID ${id}`,
      );
    }
  }

  async findByName(nombre: string): Promise<TipoVehiculo[]> {
    if (!nombre) {
      throw new BadRequestException('Debe proporcionar un nombre para buscar');
    }

    return this.tipoVehiculoRepo
      .createQueryBuilder('tipo')
      .where('tipo.nombre LIKE :nombre', {
        nombre: `%${nombre.toUpperCase()}%`,
      })
      .orderBy('tipo.nombre', 'ASC')
      .getMany();
  }
}
