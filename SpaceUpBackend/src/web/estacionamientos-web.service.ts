import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estacionamiento } from 'src/estacionamiento/estacionamiento.entity';

interface EstacionamientoCard {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  horaApertura: string;
  horaCierre: string;
  es24h: boolean;
  cuposTotales: number;
  cuposDisponibles: number;
  porcentajeOcupacion: number;
  estadoColor: string;
  nombreEmpresa: string;
  estado: boolean;
  encargado: any;
  cuposVehiculo: any[];
}

@Injectable()
export class EstacionamientosWebService {
  constructor(
    @InjectRepository(Estacionamiento)
    private estacionamientoRepo: Repository<Estacionamiento>,
  ) {}

  async getAllWithDetails(
    page: number = 1,
    limit: number = 5,
  ): Promise<{
    estacionamientos: EstacionamientoCard[];
    todosEstacionamientos: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const todosEstacionamientos = await this.estacionamientoRepo.find({
      relations: ['empresa', 'encargado', 'cuposVehiculo'],
      order: { id_estacionamiento: 'DESC' },
    });

    const skip = (page - 1) * limit;
    const estacionamientosPaginados = todosEstacionamientos.slice(
      skip,
      skip + limit,
    );

    const estacionamientosCard: EstacionamientoCard[] =
      estacionamientosPaginados.map((est) => {
        const porcentajeOcupacion =
          est.cupos_totales > 0
            ? ((est.cupos_totales - est.cupos_disponibles) /
                est.cupos_totales) *
              100
            : 0;

        let estadoColor = '#10B981';
        if (porcentajeOcupacion >= 80) {
          estadoColor = '#EF4444';
        } else if (porcentajeOcupacion >= 60) {
          estadoColor = '#F59E0B';
        }

        return {
          id: est.id_estacionamiento,
          nombre: est.nombre,
          direccion: est.direccion || '',
          telefono: est.telefono || '',
          horaApertura: est.hora_apertura || '',
          horaCierre: est.hora_cierre || '',
          es24h: est.es24h,
          cuposTotales: est.cupos_totales,
          cuposDisponibles: est.cupos_disponibles,
          porcentajeOcupacion: parseFloat(porcentajeOcupacion.toFixed(2)),
          estadoColor,
          nombreEmpresa: est.empresa?.nombre_empresa || '',
          estado: est.estado,
          encargado: est.encargado,
          cuposVehiculo:
            est.cuposVehiculo?.map((cv) => ({
              tipo_vehiculo: cv.tipo_vehiculo || '—',
              cupos_totales: cv.cupos_totales,
              cupos_disponibles: cv.cupos_disponibles,
            })) || [],
        };
      });

    const todosParaTotales = todosEstacionamientos.map((e) => ({
      cupos_totales: e.cupos_totales,
      cupos_disponibles: e.cupos_disponibles,
    }));

    return {
      estacionamientos: estacionamientosCard,
      todosEstacionamientos: todosParaTotales,
      total: todosEstacionamientos.length,
      page,
      totalPages: Math.ceil(todosEstacionamientos.length / limit),
    };
  }
}
