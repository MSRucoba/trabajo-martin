import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Usuario } from 'src/usuario/usuario.entity';
import { Empresa } from 'src/empresa/empresa.entity';
import { Estacionamiento } from 'src/estacionamiento/estacionamiento.entity';
import { Reserva } from 'src/reserva/reserva.entity';
import { Pago } from 'src/pago/pago.entity';
import { UserRole } from 'src/usuario/user-role.enum';
import { EstadoReserva } from 'src/reserva/enums/estado-reserva.enum';

interface DashboardStats {
  usuariosRegistrados: number;
  empresasActivas: number;
  estacionamientosTotales: number;
  reservasActivas: number;
  ingresosMesActual: number;
  ingresosDelMes: { fecha: string; monto: number }[];
  reservasDelMes: number;
  pagosPendientes: number;
  distribucionUsuarios: {
    conductores: number;
    anfitriones: number;
    encargados: number;
    administradores: number;
  };
}

@Injectable()
export class DashboardWebService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(Estacionamiento)
    private estacionamientoRepo: Repository<Estacionamiento>,
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
    @InjectRepository(Pago)
    private pagoRepo: Repository<Pago>,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [
      usuariosRegistrados,
      empresasActivas,
      estacionamientosTotales,
      reservasActivas,
      reservasDelMes,
      pagosMes,
      conductores,
      anfitriones,
      encargados,
      administradores,
      pagosPendientes,
    ] = await Promise.all([
      this.usuarioRepo.count(),
      this.empresaRepo.count(),
      this.estacionamientoRepo.count(),
      this.reservaRepo.count({
        where: [
          { estado: EstadoReserva.PENDIENTE },
          { estado: EstadoReserva.CONSUMO },
        ],
      }),
      this.reservaRepo.count({
        where: {
          fechaReserva: Between(inicioMes, finMes),
        },
      }),
      this.pagoRepo.find({
        where: {
          fechaCreacion: Between(inicioMes, finMes),
          status: 'succeeded',
        },
        select: ['monto', 'fechaPago'],
      }),
      this.usuarioRepo.count({ where: { rol: UserRole.CONDUCTOR } }),
      this.usuarioRepo.count({ where: { rol: UserRole.ANFITRION } }),
      this.usuarioRepo.count({ where: { rol: UserRole.ENCARGADO } }),
      this.usuarioRepo.count({ where: { rol: UserRole.ADMIN } }),
      this.pagoRepo.count({ where: { status: 'pending' } }),
    ]);

    const ingresosMesActual = pagosMes.reduce(
      (sum, p) => sum + Number(p.monto),
      0,
    );

    const ingresosDelMes = this.agruparIngresosPorDia(
      pagosMes,
      inicioMes,
      finMes,
    );

    return {
      usuariosRegistrados,
      empresasActivas,
      estacionamientosTotales,
      reservasActivas,
      ingresosMesActual: parseFloat(ingresosMesActual.toFixed(2)),
      ingresosDelMes,
      reservasDelMes,
      pagosPendientes,
      distribucionUsuarios: {
        conductores,
        anfitriones,
        encargados,
        administradores,
      },
    };
  }

  private agruparIngresosPorDia(
    pagos: Pago[],
    inicio: Date,
    fin: Date,
  ): { fecha: string; monto: number }[] {
    const diasDelMes = fin.getDate();
    const ingresosMap = new Map<string, number>();

    for (let dia = 1; dia <= diasDelMes; dia++) {
      const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), dia);
      const fechaStr = fecha.toISOString().split('T')[0];
      ingresosMap.set(fechaStr, 0);
    }

    pagos.forEach((pago) => {
      if (pago.fechaPago) {
        const fechaStr = pago.fechaPago.toISOString().split('T')[0];
        const montoActual = ingresosMap.get(fechaStr) || 0;
        ingresosMap.set(fechaStr, montoActual + Number(pago.monto));
      }
    });

    return Array.from(ingresosMap.entries())
      .map(([fecha, monto]) => ({
        fecha,
        monto: parseFloat(monto.toFixed(2)),
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}
