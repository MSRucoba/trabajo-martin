import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pago } from '../pago/pago.entity';

interface PagoCard {
  id: number;
  nombreCliente: string;
  emailCliente: string;
  monto: number;
  voucherCode: string;
  status: string;
  fechaCreacion: Date;
  fechaPago: Date | null;
  metodo: string;
  reserva: any;
}

interface PagosDelMes {
  dia: number;
  monto: number;
}

@Injectable()
export class PagosWebService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepo: Repository<Pago>,
  ) {}

  async getAllWithDetails(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    pagos: PagoCard[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [pagos, total] = await this.pagoRepo.findAndCount({
      relations: ['reserva', 'reserva.vehiculo', 'reserva.vehiculo.usuario'],
      skip,
      take: limit,
      order: { fechaCreacion: 'DESC' },
    });

    const pagosCard: PagoCard[] = pagos.map((pago) => ({
      id: pago.id,
      nombreCliente:
        `${pago.reserva?.vehiculo?.usuario?.nombre || ''} ${pago.reserva?.vehiculo?.usuario?.apellido || ''}`.trim() ||
        pago.reserva?.usuario?.nombre ||
        '—',
      emailCliente:
        pago.reserva?.vehiculo?.usuario?.email ||
        pago.reserva?.usuario?.email ||
        '',
      monto: parseFloat(pago.monto.toString()),
      voucherCode: pago.voucherCode,
      status: pago.status,
      fechaCreacion: pago.fechaCreacion,
      fechaPago: pago.fechaPago ?? null,
      metodo: 'Tarjeta',
      reserva: pago.reserva,
    }));

    return {
      pagos: pagosCard,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getGananciasDelMes(
    year: number,
    month: number,
  ): Promise<PagosDelMes[]> {
    const inicioMes = new Date(year, month - 1, 1);
    const finMes = new Date(year, month, 0, 23, 59, 59);
    const diasDelMes = finMes.getDate();

    const pagos = await this.pagoRepo.find({
      where: {
        fechaPago: Between(inicioMes, finMes),
        status: 'succeeded',
      },
      select: ['fechaPago', 'monto'],
    });

    const gananciasMap = new Map<number, number>();

    for (let dia = 1; dia <= diasDelMes; dia++) {
      gananciasMap.set(dia, 0);
    }

    pagos.forEach((pago) => {
      if (pago.fechaPago) {
        const dia = pago.fechaPago.getDate();
        const montoActual = gananciasMap.get(dia) || 0;
        gananciasMap.set(dia, montoActual + Number(pago.monto));
      }
    });

    return Array.from(gananciasMap.entries())
      .map(([dia, monto]) => ({
        dia,
        monto: parseFloat(monto.toFixed(2)),
      }))
      .sort((a, b) => a.dia - b.dia);
  }
}
