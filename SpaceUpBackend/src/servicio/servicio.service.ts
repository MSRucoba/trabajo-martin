import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  async create(dto: CreateServicioDto): Promise<Servicio> {
    const servicio = this.servicioRepository.create(dto);
    return await this.servicioRepository.save(servicio);
  }

  async findAll(): Promise<Servicio[]> {
    return await this.servicioRepository.find();
  }

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { id_servicio: id },
    });
    if (!servicio)
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    return servicio;
  }

  async update(id: number, dto: UpdateServicioDto): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { id_servicio: id },
    });
    if (!servicio)
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    servicio.nombre = dto.nombre ?? servicio.nombre;
    return await this.servicioRepository.save(servicio);
  }

  async remove(id: number): Promise<void> {
    const servicio = await this.servicioRepository.findOne({
      where: { id_servicio: id },
    });
    if (!servicio)
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    await this.servicioRepository.remove(servicio);
  }
}
