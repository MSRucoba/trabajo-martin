import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifa } from './tarifa.entity';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';

@Injectable()
export class TarifaService {
  constructor(
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
  ) {}

  async create(dto: CreateTarifaDto): Promise<Tarifa> {
    const existing = await this.tarifaRepository.findOne({
      where: {
        tipo_vehiculo: dto.tipo_vehiculo,
        tipo_tarifa: dto.tipo_tarifa,
        estacionamiento: { id_estacionamiento: dto.id_estacionamiento },
      },
      relations: ['estacionamiento'],
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una tarifa para el tipo de vehículo "${dto.tipo_vehiculo}" con tipo de tarifa "${dto.tipo_tarifa}" en este estacionamiento`,
      );
    }

    const tarifa = this.tarifaRepository.create({
      tipo_vehiculo: dto.tipo_vehiculo,
      tipo_tarifa: dto.tipo_tarifa,
      monto: dto.monto,
      estacionamiento: { id_estacionamiento: dto.id_estacionamiento } as any,
    });

    return this.tarifaRepository.save(tarifa);
  }

  async findAll(): Promise<Tarifa[]> {
    return this.tarifaRepository.find({ relations: ['estacionamiento'] });
  }

  async findOne(id: number): Promise<Tarifa> {
    const tarifa = await this.tarifaRepository.findOne({
      where: { id_tarifa: id },
      relations: ['estacionamiento'],
    });
    if (!tarifa)
      throw new NotFoundException(`Tarifa con id ${id} no encontrada`);
    return tarifa;
  }

  async update(id: number, dto: UpdateTarifaDto): Promise<Tarifa> {
    if (dto.tipo_vehiculo && dto.tipo_tarifa && dto.id_estacionamiento) {
      const existing = await this.tarifaRepository.findOne({
        where: {
          tipo_vehiculo: dto.tipo_vehiculo,
          tipo_tarifa: dto.tipo_tarifa,
          estacionamiento: { id_estacionamiento: dto.id_estacionamiento },
        },
        relations: ['estacionamiento'],
      });

      if (existing && existing.id_tarifa !== id) {
        throw new ConflictException(
          `Ya existe una tarifa para el tipo de vehículo "${dto.tipo_vehiculo}" con tipo de tarifa "${dto.tipo_tarifa}" en este estacionamiento`,
        );
      }
    }

    await this.tarifaRepository.update(id, {
      tipo_vehiculo: dto.tipo_vehiculo,
      tipo_tarifa: dto.tipo_tarifa,
      monto: dto.monto,
      estacionamiento: { id_estacionamiento: dto.id_estacionamiento } as any,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.tarifaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tarifa con id ${id} no encontrada`);
    }
  }
}
