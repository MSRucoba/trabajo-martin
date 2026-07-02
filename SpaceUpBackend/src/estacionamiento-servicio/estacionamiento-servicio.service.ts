import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstacionamientoServicio } from './estacionamiento-servicio.entity';
import { CreateEstacionamientoServicioDto } from './dto/create-estacionamiento-servicio.dto';
import { UpdateEstacionamientoServicioDto } from './dto/update-estacionamiento-servicio.dto';

@Injectable()
export class EstacionamientoServicioService {
  constructor(
    @InjectRepository(EstacionamientoServicio)
    private readonly repo: Repository<EstacionamientoServicio>,
  ) {}

  async create(
    dto: CreateEstacionamientoServicioDto,
  ): Promise<EstacionamientoServicio> {
    const entity = this.repo.create({
      estacionamiento: { id_estacionamiento: dto.id_estacionamiento } as any,
      servicio: { id_servicio: dto.id_servicio } as any,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<EstacionamientoServicio[]> {
    return this.repo.find({
      relations: ['estacionamiento', 'servicio'],
      where: { estado: true },
    });
  }

  async findOne(id: number): Promise<EstacionamientoServicio> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['estacionamiento', 'servicio'],
    });
    if (!entity)
      throw new NotFoundException(`Registro con id ${id} no encontrado`);
    return entity;
  }

  async update(
    id: number,
    dto: UpdateEstacionamientoServicioDto,
  ): Promise<EstacionamientoServicio> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity)
      throw new NotFoundException(`Registro con id ${id} no encontrado`);
    entity.estacionamiento = {
      id_estacionamiento: dto.id_estacionamiento,
    } as any;
    entity.servicio = { id_servicio: dto.id_servicio } as any;
    if ((dto as any).estado !== undefined) {
      entity.estado = (dto as any).estado;
    }
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity)
      throw new NotFoundException(`Registro con id ${id} no encontrado`);
    entity.estado = false;
    await this.repo.save(entity);
  }
}
