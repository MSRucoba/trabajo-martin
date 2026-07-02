import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { SunatService } from './sunat.service';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly sunatService: SunatService,
  ) {}

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    const existing = await this.empresaRepository.findOne({
      where: { ruc: dto.ruc },
    });

    if (existing) {
      throw new ConflictException('El RUC ya está registrado');
    }

    const datosRuc: any = await this.sunatService.consultarRuc(dto.ruc);

    if (!datosRuc || !datosRuc.razon_social) {
      throw new ConflictException('El RUC no es válido o no existe en SUNAT');
    }

    const empresa = this.empresaRepository.create({
      nombre_empresa: datosRuc.razon_social,
      ruc: dto.ruc,
      numero_contacto: dto.numero_contacto,
      usuario: { id: dto.id_usuario } as any,
    });

    return await this.empresaRepository.save(empresa);
  }

  async findAll(): Promise<Empresa[]> {
    return await this.empresaRepository.find({ relations: ['usuario'] });
  }

  async findOne(id: number): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: id },
      relations: ['usuario'],
    });
    if (!empresa)
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    return empresa;
  }

  async update(id: number, dto: UpdateEmpresaDto): Promise<Empresa> {
    if (dto.ruc) {
      const existing = await this.empresaRepository.findOne({
        where: { ruc: dto.ruc },
      });
      if (existing && existing.id_empresa !== id) {
        throw new ConflictException('El RUC ya está registrado');
      }
    }

    await this.empresaRepository.update(id, {
      nombre_empresa: dto.nombre_empresa,
      ruc: dto.ruc,
      numero_contacto: dto.numero_contacto,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.empresaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    }
  }

  async verificarRuc(ruc: string) {
    const data: any = await this.sunatService.consultarRuc(ruc);

    const razonSocial =
      data?.data?.razon_social ||
      data?.data?.nombre_o_razon_social ||
      data?.razon_social ||
      data?.nombre_o_razon_social ||
      null;

    return {
      ruc,
      razon_social: razonSocial,
    };
  }

  async findByUserId(userId: number): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { usuario: { id: userId } },
      relations: ['usuario'],
    });

    if (!empresa) {
      throw new NotFoundException(
        `No se encontró empresa para el usuario con ID ${userId}`,
      );
    }

    return empresa;
  }
}
