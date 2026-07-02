import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoVehiculo } from '../tipo-vehiculo/tipo-vehiculo.entity';
import { Servicio } from '../servicio/servicio.entity';
import { Vehiculo } from '../vehiculo/vehiculo.entity';
import { EstacionamientoServicio } from '../estacionamiento-servicio/estacionamiento-servicio.entity';

interface TipoVehiculoUsage {
  id: number;
  nombre: string;
  cantidadVehiculosRegistrados: number;
}

interface ServicioUsage {
  id: number;
  nombre: string;
  cantidadEstacionamientosUsandolo: number;
}

@Injectable()
export class TiposServiciosWebService {
  constructor(
    @InjectRepository(TipoVehiculo)
    private tipoVehiculoRepo: Repository<TipoVehiculo>,
    @InjectRepository(Servicio)
    private servicioRepo: Repository<Servicio>,
    @InjectRepository(Vehiculo)
    private vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(EstacionamientoServicio)
    private estacionamientoServicioRepo: Repository<EstacionamientoServicio>,
  ) {}

  async getTiposVehiculoConUsage(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    tiposVehiculo: TipoVehiculoUsage[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [tipos, total] = await this.tipoVehiculoRepo.findAndCount({
      skip,
      take: limit,
      order: { nombre: 'ASC' },
    });

    const tiposVehiculoUsage: TipoVehiculoUsage[] = await Promise.all(
      tipos.map(async (tipo) => {
        const cantidadVehiculos = await this.vehiculoRepo.count({
          where: { tipoVehiculo: { id: tipo.id } },
        });

        return {
          id: tipo.id,
          nombre: tipo.nombre,
          cantidadVehiculosRegistrados: cantidadVehiculos,
        };
      }),
    );

    return {
      tiposVehiculo: tiposVehiculoUsage,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getServiciosConUsage(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    servicios: ServicioUsage[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [servicios, total] = await this.servicioRepo.findAndCount({
      skip,
      take: limit,
      order: { nombre: 'ASC' },
    });

    const serviciosUsage: ServicioUsage[] = await Promise.all(
      servicios.map(async (servicio) => {
        const cantidadEstacionamientos =
          await this.estacionamientoServicioRepo.count({
            where: {
              servicio: { id_servicio: servicio.id_servicio },
              estado: true,
            },
          });

        return {
          id: servicio.id_servicio,
          nombre: servicio.nombre,
          cantidadEstacionamientosUsandolo: cantidadEstacionamientos,
        };
      }),
    );

    return {
      servicios: serviciosUsage,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
