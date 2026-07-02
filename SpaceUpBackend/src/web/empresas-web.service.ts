import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/empresa.entity';

interface EmpresaCard {
  id: number;
  nombreEmpresa: string;
  ruc: string;
  numeroContacto: string;
  nombreAnfitrion: string;
  emailAnfitrion: string;
  cantidadEstacionamientos: number;
  cuposTotales: number;
  cuposOcupados: number;
}

@Injectable()
export class EmpresasWebService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
  ) {}

  async getAllWithDetails(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    empresas: EmpresaCard[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [empresas, total] = await this.empresaRepo.findAndCount({
      relations: ['usuario', 'estacionamientos'],
      skip,
      take: limit,
      order: { id_empresa: 'DESC' },
    });

    const empresasCard: EmpresaCard[] = empresas.map((empresa) => {
      const cuposTotales = empresa.estacionamientos.reduce(
        (sum, est) => sum + (est.cupos_totales || 0),
        0,
      );
      const cuposDisponibles = empresa.estacionamientos.reduce(
        (sum, est) => sum + (est.cupos_disponibles || 0),
        0,
      );
      const cuposOcupados = cuposTotales - cuposDisponibles;

      return {
        id: empresa.id_empresa,
        nombreEmpresa: empresa.nombre_empresa,
        ruc: empresa.ruc,
        numeroContacto: empresa.numero_contacto,
        nombreAnfitrion:
          `${empresa.usuario?.nombre || ''} ${empresa.usuario?.apellido || ''}`.trim(),
        emailAnfitrion: empresa.usuario?.email || '',
        cantidadEstacionamientos: empresa.estacionamientos?.length || 0,
        cuposTotales,
        cuposOcupados,
      };
    });

    return {
      empresas: empresasCard,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOneWithDetails(id: number): Promise<EmpresaCard> {
    const empresa = await this.empresaRepo.findOne({
      where: { id_empresa: id },
      relations: ['usuario', 'estacionamientos'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    const cuposTotales = empresa.estacionamientos.reduce(
      (sum, est) => sum + (est.cupos_totales || 0),
      0,
    );
    const cuposDisponibles = empresa.estacionamientos.reduce(
      (sum, est) => sum + (est.cupos_disponibles || 0),
      0,
    );
    const cuposOcupados = cuposTotales - cuposDisponibles;

    return {
      id: empresa.id_empresa,
      nombreEmpresa: empresa.nombre_empresa,
      ruc: empresa.ruc,
      numeroContacto: empresa.numero_contacto,
      nombreAnfitrion:
        `${empresa.usuario?.nombre || ''} ${empresa.usuario?.apellido || ''}`.trim(),
      emailAnfitrion: empresa.usuario?.email || '',
      cantidadEstacionamientos: empresa.estacionamientos?.length || 0,
      cuposTotales,
      cuposOcupados,
    };
  }
}
