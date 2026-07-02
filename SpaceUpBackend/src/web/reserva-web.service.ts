import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from '../reserva/reserva.entity';

interface ReservaCard {
  id: number;
  codigoReserva: string;
  nombreCliente: string;
  emailCliente: string;
  placaVehiculo: string;
  tipoVehiculo: string;
  nombreEstacionamiento: string;
  fechaRegistro: Date;
  fechaInicio: Date;
  fechaFin: Date;
  estado: string;
  total: number;
}

@Injectable()
export class ReservasWebService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
  ) {}

  async getAllWithDetails(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reservas: ReservaCard[];
    todasReservas: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const todasReservas = await this.reservaRepo.find({
      relations: [
        'usuario',
        'vehiculo',
        'vehiculo.tipoVehiculo',
        'estacionamiento',
      ],
      order: { fechaReserva: 'DESC' },
    });

    const skip = (page - 1) * limit;
    const reservasPaginadas = todasReservas.slice(skip, skip + limit);

    const reservasCard: ReservaCard[] = reservasPaginadas.map((reserva) => ({
      id: reserva.id,
      codigoReserva: reserva.codigoReserva || 'N/A',
      nombreCliente:
        `${reserva.usuario?.nombre || ''} ${reserva.usuario?.apellido || ''}`.trim(),
      emailCliente: reserva.usuario?.email || '',
      placaVehiculo: reserva.vehiculo?.placa || '',
      tipoVehiculo: reserva.vehiculo?.tipoVehiculo?.nombre || '',
      nombreEstacionamiento: reserva.estacionamiento?.nombre || '',
      fechaRegistro: reserva.fechaReserva,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      estado: reserva.estado,
      total: parseFloat(reserva.total.toString()),
    }));

    const todasParaCalcular = todasReservas.map((r) => ({
      estado: r.estado,
      total: parseFloat(r.total.toString()),
      fechaInicio: r.fechaInicio,
      fechaReserva: r.fechaReserva,
    }));

    return {
      reservas: reservasCard,
      todasReservas: todasParaCalcular,
      total: todasReservas.length,
      page,
      totalPages: Math.ceil(todasReservas.length / limit),
    };
  }
}
