import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Reserva } from './reserva.entity';
import { EstadoReserva } from './enums/estado-reserva.enum';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { Vehiculo } from '../vehiculo/vehiculo.entity';
import { Tarifa } from '../tarifa/tarifa.entity';
import { TipoVehiculo } from '../tipo-vehiculo/tipo-vehiculo.entity';
import { PagoService } from '../pago/pago.service';
import { CreateReservaResponse } from './dto/create-reserva-response.interface';
import { RegistrarLlegadaDto } from './dto/registrar-llegada.dto';
import { CupoVehiculo } from 'src/cupo-vehiculo/cupo-vehiculo.entity';

@Injectable()
export class ReservaService {
  private readonly logger = new Logger(ReservaService.name);

  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    @InjectRepository(Estacionamiento)
    private readonly estacionamientoRepo: Repository<Estacionamiento>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(Tarifa)
    private readonly tarifaRepo: Repository<Tarifa>,
    @InjectRepository(TipoVehiculo)
    private readonly tipoVehiculoRepo: Repository<TipoVehiculo>,
    private readonly pagoService: PagoService,
    @InjectRepository(CupoVehiculo)
    private readonly cupoVehiculoRepo: Repository<CupoVehiculo>,
  ) {}

  // ========== MÉTODO PRIVADO PARA GENERAR CÓDIGO ÚNICO ==========
  private generarCodigoUnico(idReserva: number): string {
    const uniqueHash = randomBytes(3).toString('hex').toUpperCase();
    const idPadded = idReserva.toString().padStart(5, '0');
    return `RES-${uniqueHash}-${idPadded}`;
  }

  async create(dto: CreateReservaDto): Promise<CreateReservaResponse> {
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);
    const ahora = new Date();
    const tipoTarifa = dto.tipo_tarifa || 'HORA';

    this.validarFechas(fechaInicio, fechaFin, ahora, tipoTarifa);

    const estacionamiento = await this.estacionamientoRepo.findOne({
      where: { id_estacionamiento: dto.id_estacionamiento },
    });
    if (!estacionamiento)
      throw new NotFoundException(
        `Estacionamiento con ID ${dto.id_estacionamiento} no encontrado`,
      );
    if (!estacionamiento.estado)
      throw new ConflictException(
        'El estacionamiento está inhabilitado temporalmente',
      );

    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id: dto.id_vehiculo },
      relations: ['tipoVehiculo', 'usuario'],
    });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');

    const tipoVehiculo = vehiculo.tipoVehiculo;
    if (!tipoVehiculo)
      throw new NotFoundException(`El vehículo no tiene tipo asignado`);

    const tarifa = await this.tarifaRepo
      .createQueryBuilder('t')
      .where('t.id_estacionamiento = :idEst', {
        idEst: estacionamiento.id_estacionamiento,
      })
      .andWhere('t.tipo_vehiculo = :tipo', { tipo: tipoVehiculo.nombre })
      .andWhere('t.tipo_tarifa = :tarifa', { tarifa: tipoTarifa })
      .getOne();

    if (!tarifa)
      throw new NotFoundException(
        `No hay tarifa registrada para ${tipoVehiculo.nombre} (${tipoTarifa}) en este estacionamiento`,
      );

    const duracionHoras =
      (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

    let total = 0;
    let cantidad: number;

    switch (tipoTarifa.toUpperCase()) {
      case 'HORA':
        cantidad = dto.cantidad || Math.ceil(duracionHoras);
        total = tarifa.monto * cantidad;
        break;

      case 'DIA':
        cantidad = dto.cantidad || 1;
        total = tarifa.monto * cantidad;
        break;

      case 'SEMANA':
        cantidad = dto.cantidad || Math.ceil(duracionHoras / (24 * 7));
        total = tarifa.monto * cantidad;
        break;

      case 'MES':
        if (dto.cantidad) {
          cantidad = dto.cantidad;
        } else {
          const inicio = new Date(dto.fechaInicio);
          const fin = new Date(dto.fechaFin);

          let mesesDiferencia =
            (fin.getFullYear() - inicio.getFullYear()) * 12 +
            (fin.getMonth() - inicio.getMonth());

          if (fin.getDate() < inicio.getDate()) {
            mesesDiferencia--;
          }

          cantidad = Math.max(1, mesesDiferencia);
        }
        total = tarifa.monto * cantidad;
        break;

      default:
        throw new BadRequestException(
          `Tipo de tarifa no reconocido: ${tipoTarifa}`,
        );
    }

    this.logger.log(`Reserva creada: ${tipoTarifa.toUpperCase()}`);
    this.logger.log(`  - Cantidad recibida: ${dto.cantidad || 'no enviada'}`);
    this.logger.log(`  - Cantidad calculada: ${cantidad}`);
    this.logger.log(`  - Duración en horas: ${duracionHoras.toFixed(2)}`);
    this.logger.log(`  - Tarifa base: S/. ${tarifa.monto}`);
    this.logger.log(`  - Total: S/. ${total.toFixed(2)}`);

    const reserva = this.reservaRepo.create({
      fechaInicio,
      fechaFin,
      estado: EstadoReserva.PENDIENTE,
      total,
      tipo_tarifa: tipoTarifa,
      estacionamiento: { id_estacionamiento: dto.id_estacionamiento } as any,
      vehiculo: { id: dto.id_vehiculo } as any,
      usuario: { id: dto.id_usuario } as any,
    });

    const saved = await this.reservaRepo.save(reserva);

    // ========== GENERAR Y GUARDAR CÓDIGO ÚNICO ==========
    const codigoReserva = this.generarCodigoUnico(saved.id);
    saved.codigoReserva = codigoReserva;
    await this.reservaRepo.save(saved);

    this.logger.log(`Código de reserva generado: ${codigoReserva}`);

    const reservaFinal = await this.reservaRepo.findOne({
      where: { id: saved.id },
      relations: [
        'usuario',
        'vehiculo',
        'vehiculo.tipoVehiculo',
        'vehiculo.usuario',
        'estacionamiento',
        'estacionamiento.tarifas',
      ],
    });

    if (!reservaFinal)
      throw new NotFoundException(
        'Error interno: reserva no encontrada tras guardarse',
      );

    this.logger.log('Preparando para crear pago automático');
    this.logger.log(`Reserva ID: ${reservaFinal.id}`);
    this.logger.log(`Total: ${total}`);
    this.logger.log(`Usuario: ${reservaFinal.usuario?.id}`);
    this.logger.log(`Vehículo: ${reservaFinal.vehiculo?.id}`);
    this.logger.log(
      `Tipo vehículo: ${reservaFinal.vehiculo?.tipoVehiculo?.nombre}`,
    );
    this.logger.log(`Tipo tarifa: ${reservaFinal.tipo_tarifa}`);
    this.logger.log(
      `Tarifas cargadas: ${reservaFinal.estacionamiento?.tarifas?.length || 0}`,
    );

    try {
      this.logger.log('Llamando a pagoService.create()');

      const pagoResult = await this.pagoService.create({
        id_reserva: reservaFinal.id,
        monto: total,
      });

      this.logger.log('Pago creado exitosamente');
      this.logger.log(`Pago ID: ${pagoResult.pago?.id}`);
      this.logger.log(
        `PaymentIntent: ${pagoResult.pago?.stripePaymentIntentId}`,
      );
      this.logger.log(
        `ClientSecret: ${pagoResult.clientSecret ? 'Generado' : 'NO GENERADO'}`,
      );

      const pago = pagoResult.pago;
      const clientSecret = pagoResult.clientSecret;

      return {
        reserva: reservaFinal,
        pago,
        clientSecret,
      };
    } catch (error) {
      this.logger.error(`Error creando el pago automático`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);

      return {
        reserva: reservaFinal,
        pago: null,
        error: error.message,
      };
    }
  }

  async previsualizarMonto(
    id_estacionamiento: number,
    id_vehiculo: number,
    fechaInicio: string,
    fechaFin: string,
    tipo_tarifa?: string,
    cantidad?: number,
  ): Promise<{ monto: number; detalle: string }> {
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestException('Debe proporcionar fechas válidas');
    }

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    const duracionHoras =
      (fechaFinDate.getTime() - fechaInicioDate.getTime()) / (1000 * 60 * 60);

    if (isNaN(duracionHoras) || duracionHoras <= 0) {
      throw new BadRequestException('El rango de fechas no es válido');
    }

    const estacionamiento = await this.estacionamientoRepo.findOne({
      where: { id_estacionamiento },
    });
    if (!estacionamiento) {
      throw new NotFoundException(
        `Estacionamiento con ID ${id_estacionamiento} no encontrado`,
      );
    }

    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id: id_vehiculo },
      relations: ['tipoVehiculo'],
    });
    if (!vehiculo) {
      throw new NotFoundException(
        `Vehículo con ID ${id_vehiculo} no encontrado`,
      );
    }

    const tipoVehiculo = vehiculo.tipoVehiculo;
    if (!tipoVehiculo) {
      throw new NotFoundException('El vehículo no tiene un tipo asociado');
    }

    const tipoTarifa = tipo_tarifa || 'HORA';
    const tarifa = await this.tarifaRepo
      .createQueryBuilder('t')
      .where('t.id_estacionamiento = :idEst', { idEst: id_estacionamiento })
      .andWhere('t.tipo_vehiculo = :tipo', { tipo: tipoVehiculo.nombre })
      .andWhere('t.tipo_tarifa = :tarifa', { tarifa: tipoTarifa })
      .getOne();

    if (!tarifa) {
      throw new NotFoundException(
        `No hay tarifa registrada para ${tipoVehiculo.nombre} (${tipoTarifa}) en este estacionamiento`,
      );
    }

    let monto: number;
    let cantidadFinal: number;
    let unidad: string;

    switch (tipoTarifa.toUpperCase()) {
      case 'HORA':
        cantidadFinal = cantidad || Math.ceil(duracionHoras);
        unidad = cantidadFinal === 1 ? 'hora' : 'horas';
        monto = tarifa.monto * cantidadFinal;
        break;

      case 'DIA':
        cantidadFinal = cantidad || 1;
        unidad = cantidadFinal === 1 ? 'día' : 'días';
        monto = tarifa.monto * cantidadFinal;
        break;

      case 'SEMANA':
        cantidadFinal = cantidad || Math.ceil(duracionHoras / (24 * 7));
        unidad = cantidadFinal === 1 ? 'semana' : 'semanas';
        monto = tarifa.monto * cantidadFinal;
        break;

      case 'MES':
        if (cantidad) {
          cantidadFinal = cantidad;
        } else {
          // Cálculo mejorado de meses
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);

          let mesesDiferencia =
            (fin.getFullYear() - inicio.getFullYear()) * 12 +
            (fin.getMonth() - inicio.getMonth());

          if (fin.getDate() < inicio.getDate()) {
            mesesDiferencia--;
          }

          cantidadFinal = Math.max(1, mesesDiferencia);
        }
        unidad = cantidadFinal === 1 ? 'mes' : 'meses';
        monto = tarifa.monto * cantidadFinal;
        break;

      default:
        throw new BadRequestException(
          `Tipo de tarifa no reconocido: ${tipoTarifa}`,
        );
    }

    this.logger.log(`Preview monto: ${tipoTarifa.toUpperCase()}`);
    this.logger.log(`  - Cantidad: ${cantidadFinal}`);
    this.logger.log(`  - Duración (horas): ${duracionHoras.toFixed(2)}`);
    this.logger.log(`  - Monto calculado: S/. ${monto.toFixed(2)}`);

    return {
      monto: parseFloat(monto.toFixed(2)),
      detalle: `${cantidadFinal} ${unidad} × S/.${Number(tarifa.monto).toFixed(2)} (${tipoVehiculo.nombre})`,
    };
  }

  private validarFechas(
    fechaInicio: Date,
    fechaFin: Date,
    ahora: Date,
    tipoTarifa?: string,
  ) {
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la de inicio',
      );
    }

    const tipoTarifaUpper = tipoTarifa?.toUpperCase() || 'HORA';

    if (['SEMANA', 'MES'].includes(tipoTarifaUpper)) {
      const hoy = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
      );
      const fechaInicioSinHora = new Date(
        fechaInicio.getFullYear(),
        fechaInicio.getMonth(),
        fechaInicio.getDate(),
      );

      if (fechaInicioSinHora < hoy) {
        throw new BadRequestException(
          'La fecha de inicio debe ser hoy o en el futuro',
        );
      }

      const duracionHoras =
        (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

      if (tipoTarifaUpper === 'SEMANA' && duracionHoras > 24 * 7 * 52) {
        throw new BadRequestException(
          'La reserva semanal no puede exceder 52 semanas (1 año)',
        );
      }

      if (tipoTarifaUpper === 'MES' && duracionHoras > 24 * 365) {
        throw new BadRequestException(
          'La reserva mensual no puede exceder 12 meses',
        );
      }
    } else {
      const margenTolerancia = 60 * 1000;
      if (fechaInicio.getTime() < ahora.getTime() - margenTolerancia) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser en el pasado',
        );
      }

      const duracionHoras =
        (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

      if (tipoTarifaUpper === 'HORA') {
        if (duracionHoras < 1) {
          throw new BadRequestException(
            'La reserva por hora debe durar al menos 1 hora',
          );
        }
        if (duracionHoras > 24) {
          throw new BadRequestException(
            'La reserva por hora no puede exceder 24 horas. Use tarifa DIA',
          );
        }
      }

      if (tipoTarifaUpper === 'DIA') {
        const dias = Math.ceil(duracionHoras / 24);

        if (dias < 1) {
          throw new BadRequestException(
            'La reserva por día debe ser de al menos 1 día',
          );
        }

        if (dias > 6) {
          throw new BadRequestException(
            'La reserva por día no puede exceder 6 días. Use tarifa SEMANA',
          );
        }
      }

      if (duracionHoras > 720) {
        throw new BadRequestException('La reserva no puede exceder 30 días');
      }
    }
  }

  async findAll(): Promise<Reserva[]> {
    const reservas = await this.reservaRepo.find({
      relations: ['vehiculo', 'estacionamiento', 'usuario'],
      order: { fechaInicio: 'ASC' },
    });
    reservas.forEach((r) => (r.estado = this.calcularEstadoActual(r)));
    return reservas;
  }

  async findOne(id: number): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({
      where: { id },
      relations: [
        'vehiculo',
        'vehiculo.tipoVehiculo',
        'estacionamiento',
        'usuario',
      ],
    });
    if (!reserva)
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    reserva.estado = this.calcularEstadoActual(reserva);
    return reserva;
  }

  // ========== NUEVO: BUSCAR POR CÓDIGO ==========
  async findByCodigo(codigo: string): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({
      where: { codigoReserva: codigo },
      relations: [
        'vehiculo',
        'vehiculo.tipoVehiculo',
        'estacionamiento',
        'usuario',
      ],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con código ${codigo} no encontrada`);
    }

    reserva.estado = this.calcularEstadoActual(reserva);
    return reserva;
  }

  // ========== NUEVO: VALIDAR CÓDIGO (PARA QR) ==========
  async validarCodigo(codigo: string): Promise<{
    valido: boolean;
    reserva?: Reserva;
    mensaje: string;
  }> {
    try {
      const reserva = await this.findByCodigo(codigo);

      return {
        valido: true,
        reserva,
        mensaje: `Reserva encontrada en estado ${reserva.estado}`,
      };
    } catch (error) {
      return {
        valido: false,
        mensaje: 'Código de reserva no válido o no encontrado',
      };
    }
  }

  async update(id: number, dto: UpdateReservaDto): Promise<Reserva> {
    const reserva = await this.findOne(id);
    if (this.calcularEstadoActual(reserva) !== EstadoReserva.PENDIENTE)
      throw new ConflictException(
        'Solo se pueden modificar reservas en estado PENDIENTE',
      );

    if (dto.fechaInicio) reserva.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) reserva.fechaFin = new Date(dto.fechaFin);
    if (dto.estado) reserva.estado = dto.estado;

    return this.reservaRepo.save(reserva);
  }

  async cancelar(id: number): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({
      where: { id },
      relations: ['estacionamiento', 'vehiculo', 'vehiculo.tipoVehiculo'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    const estadoActual = this.calcularEstadoActual(reserva);

    if (
      ![EstadoReserva.PENDIENTE, EstadoReserva.CONSUMO].includes(estadoActual)
    ) {
      throw new ConflictException(
        'Solo puedes cancelar reservas PENDIENTES o en CONSUMO',
      );
    }

    reserva.estado = EstadoReserva.CANCELADO;
    const saved = await this.reservaRepo.save(reserva);

    // Solo libera cupo si estaba en CONSUMO
    if (estadoActual === EstadoReserva.CONSUMO) {
      const tipoVehiculo = reserva.vehiculo?.tipoVehiculo?.nombre;

      if (tipoVehiculo) {
        const cupoVehiculo = await this.cupoVehiculoRepo.findOne({
          where: {
            estacionamiento: {
              id_estacionamiento: reserva.estacionamiento.id_estacionamiento,
            },
            tipo_vehiculo: tipoVehiculo,
          },
        });

        if (cupoVehiculo) {
          cupoVehiculo.cupos_disponibles = Math.min(
            cupoVehiculo.cupos_disponibles + 1,
            cupoVehiculo.cupos_totales,
          );
          await this.cupoVehiculoRepo.save(cupoVehiculo);

          this.logger.log(
            `Reserva ${reserva.id} cancelada desde CONSUMO. ` +
              `Cupo de ${tipoVehiculo} liberado. Disponibles: ${cupoVehiculo.cupos_disponibles}/${cupoVehiculo.cupos_totales}`,
          );
        }

        await this.recalcularCuposEstacionamiento(
          reserva.estacionamiento.id_estacionamiento,
        );
      }
    } else {
      this.logger.log(
        `Reserva ${reserva.id} cancelada desde PENDIENTE. No se modificaron cupos.`,
      );
    }

    return saved;
  }
  async finalizar(id: number): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({
      where: { id },
      relations: ['estacionamiento', 'vehiculo', 'vehiculo.tipoVehiculo'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    if (this.calcularEstadoActual(reserva) !== EstadoReserva.CONSUMO) {
      throw new ConflictException(
        'Solo puedes finalizar reservas en estado CONSUMO',
      );
    }

    reserva.estado = EstadoReserva.FINALIZADO;
    const saved = await this.reservaRepo.save(reserva);

    const tipoVehiculo = reserva.vehiculo?.tipoVehiculo?.nombre;

    if (tipoVehiculo) {
      const cupoVehiculo = await this.cupoVehiculoRepo.findOne({
        where: {
          estacionamiento: {
            id_estacionamiento: reserva.estacionamiento.id_estacionamiento,
          },
          tipo_vehiculo: tipoVehiculo,
        },
      });

      if (cupoVehiculo) {
        cupoVehiculo.cupos_disponibles = Math.min(
          cupoVehiculo.cupos_disponibles + 1,
          cupoVehiculo.cupos_totales,
        );
        await this.cupoVehiculoRepo.save(cupoVehiculo);

        this.logger.log(
          `Reserva ${reserva.id} finalizada. ` +
            `Cupo de ${tipoVehiculo} liberado. Disponibles: ${cupoVehiculo.cupos_disponibles}/${cupoVehiculo.cupos_totales}`,
        );
      }

      await this.recalcularCuposEstacionamiento(
        reserva.estacionamiento.id_estacionamiento,
      );
    }

    return saved;
  }

  private calcularEstadoActual(reserva: Reserva): EstadoReserva {
    const now = new Date();

    if (
      [
        EstadoReserva.CANCELADO,
        EstadoReserva.FINALIZADO,
        EstadoReserva.CONSUMO,
      ].includes(reserva.estado)
    ) {
      return reserva.estado;
    }

    if (now < reserva.fechaInicio) return EstadoReserva.PENDIENTE;
    if (now >= reserva.fechaInicio && now <= reserva.fechaFin)
      return EstadoReserva.CONSUMO;
    if (now > reserva.fechaFin) return EstadoReserva.FINALIZADO;

    return reserva.estado;
  }

  async actualizarEstados(): Promise<{ actualizadas: number }> {
    // ✅ SOLO actualiza reservas PENDIENTE (no toca CONSUMO registrado manualmente)
    const reservas = await this.reservaRepo.find({
      where: { estado: EstadoReserva.PENDIENTE }, // ← Cambiado: solo PENDIENTE
      relations: ['estacionamiento', 'vehiculo', 'vehiculo.tipoVehiculo'],
    });

    let contador = 0;

    for (const reserva of reservas) {
      const estadoAnterior = reserva.estado;
      const nuevoEstado = this.calcularEstadoActual(reserva);

      // Solo actualiza si cambió
      if (nuevoEstado !== estadoAnterior) {
        reserva.estado = nuevoEstado;
        await this.reservaRepo.save(reserva);
        contador++;

        const tipoVehiculo = reserva.vehiculo?.tipoVehiculo?.nombre;
        if (!tipoVehiculo) {
          this.logger.warn(
            `Reserva ${reserva.id}: No se pudo determinar el tipo de vehículo`,
          );
          continue;
        }

        // ========== TRANSICIÓN: PENDIENTE → CONSUMO ==========
        // Esto solo ocurre cuando la hora de inicio se alcanza naturalmente
        if (
          estadoAnterior === EstadoReserva.PENDIENTE &&
          nuevoEstado === EstadoReserva.CONSUMO
        ) {
          const cupoVehiculo = await this.cupoVehiculoRepo.findOne({
            where: {
              estacionamiento: {
                id_estacionamiento: reserva.estacionamiento.id_estacionamiento,
              },
              tipo_vehiculo: tipoVehiculo,
            },
          });

          if (cupoVehiculo && cupoVehiculo.cupos_disponibles > 0) {
            cupoVehiculo.cupos_disponibles -= 1;
            await this.cupoVehiculoRepo.save(cupoVehiculo);

            this.logger.log(
              `Reserva ${reserva.id}: PENDIENTE → CONSUMO (automático). ` +
                `Cupo de ${tipoVehiculo} ocupado. Disponibles: ${cupoVehiculo.cupos_disponibles}/${cupoVehiculo.cupos_totales}`,
            );
          } else {
            this.logger.warn(
              `❱❱❱ Reserva ${reserva.id}: No hay cupos disponibles para ${tipoVehiculo}`,
            );
          }

          await this.recalcularCuposEstacionamiento(
            reserva.estacionamiento.id_estacionamiento,
          );
        }
      }
    }

    // ✅ PROCESO SEPARADO: Finalizar reservas que ya expiraron (CONSUMO → FINALIZADO)
    const reservasEnConsumo = await this.reservaRepo.find({
      where: { estado: EstadoReserva.CONSUMO },
      relations: ['estacionamiento', 'vehiculo', 'vehiculo.tipoVehiculo'],
    });

    for (const reserva of reservasEnConsumo) {
      const now = new Date();

      // Solo finaliza si ya pasó la fechaFin
      if (now > reserva.fechaFin) {
        const tipoVehiculo = reserva.vehiculo?.tipoVehiculo?.nombre;

        reserva.estado = EstadoReserva.FINALIZADO;
        await this.reservaRepo.save(reserva);
        contador++;

        if (tipoVehiculo) {
          const cupoVehiculo = await this.cupoVehiculoRepo.findOne({
            where: {
              estacionamiento: {
                id_estacionamiento: reserva.estacionamiento.id_estacionamiento,
              },
              tipo_vehiculo: tipoVehiculo,
            },
          });

          if (cupoVehiculo) {
            cupoVehiculo.cupos_disponibles = Math.min(
              cupoVehiculo.cupos_disponibles + 1,
              cupoVehiculo.cupos_totales,
            );
            await this.cupoVehiculoRepo.save(cupoVehiculo);

            this.logger.log(
              `Reserva ${reserva.id}: CONSUMO → FINALIZADO (automático). ` +
                `Cupo de ${tipoVehiculo} liberado. Disponibles: ${cupoVehiculo.cupos_disponibles}/${cupoVehiculo.cupos_totales}`,
            );
          }

          await this.recalcularCuposEstacionamiento(
            reserva.estacionamiento.id_estacionamiento,
          );
        }
      }
    }

    return { actualizadas: contador };
  }
  async registrarLlegada(dto: RegistrarLlegadaDto): Promise<{
    reserva: Reserva;
    mensaje: string;
    opciones?: {
      puede_elegir: boolean;
      minutos_anticipacion: number;
      sugerencia: string;
    };
  }> {
    const reserva = await this.reservaRepo.findOne({
      where: { id: dto.id_reserva },
      relations: ['estacionamiento', 'vehiculo', 'vehiculo.tipoVehiculo'],
    });

    if (!reserva) {
      throw new NotFoundException(
        `Reserva con ID ${dto.id_reserva} no encontrada`,
      );
    }

    const ahora = new Date();

    if (reserva.estado !== EstadoReserva.PENDIENTE) {
      throw new ConflictException(
        `La reserva está en estado ${reserva.estado}. Solo se puede registrar llegada en reservas PENDIENTES`,
      );
    }

    if (ahora > reserva.fechaFin) {
      throw new BadRequestException(
        'La reserva ya expiró. No se puede registrar llegada.',
      );
    }

    const diferenciaMs = reserva.fechaInicio.getTime() - ahora.getTime();
    const minutosAnticipacion = Math.floor(diferenciaMs / (1000 * 60));
    const tipoVehiculo = reserva.vehiculo?.tipoVehiculo?.nombre;

    // ========== FUNCIÓN AUXILIAR: OCUPAR CUPO ==========
    const ocuparCupo = async () => {
      if (!tipoVehiculo) {
        this.logger.warn(
          `Reserva ${reserva.id}: No se pudo determinar el tipo de vehículo`,
        );
        return;
      }

      const cupoVehiculo = await this.cupoVehiculoRepo.findOne({
        where: {
          estacionamiento: {
            id_estacionamiento: reserva.estacionamiento.id_estacionamiento,
          },
          tipo_vehiculo: tipoVehiculo,
        },
      });

      if (!cupoVehiculo || cupoVehiculo.cupos_disponibles <= 0) {
        throw new ConflictException(
          `No hay cupos disponibles para ${tipoVehiculo} en este momento`,
        );
      }

      cupoVehiculo.cupos_disponibles -= 1;
      await this.cupoVehiculoRepo.save(cupoVehiculo);

      this.logger.log(
        `Reserva ${reserva.id}: Cupo de ${tipoVehiculo} ocupado manualmente. ` +
          `Disponibles: ${cupoVehiculo.cupos_disponibles}/${cupoVehiculo.cupos_totales}`,
      );

      await this.recalcularCuposEstacionamiento(
        reserva.estacionamiento.id_estacionamiento,
      );
    };

    // ========== LÓGICA DE LLEGADA ANTICIPADA ==========

    if (minutosAnticipacion > 10) {
      // Adelantar automáticamente
      const duracionOriginal =
        reserva.fechaFin.getTime() - reserva.fechaInicio.getTime();
      reserva.fechaInicio = ahora;
      reserva.fechaFin = new Date(ahora.getTime() + duracionOriginal);
      reserva.estado = EstadoReserva.CONSUMO;

      await ocuparCupo();
      const saved = await this.reservaRepo.save(reserva);

      return {
        reserva: saved,
        mensaje: `Llegó ${minutosAnticipacion} minutos antes. Horario ajustado automáticamente y cupo ocupado.`,
      };
    }

    if (minutosAnticipacion >= 1 && minutosAnticipacion <= 10) {
      if (dto.adelantar_horario === undefined) {
        return {
          reserva,
          mensaje: 'El conductor llegó antes de tiempo. ¿Qué desea hacer?',
          opciones: {
            puede_elegir: true,
            minutos_anticipacion: minutosAnticipacion,
            sugerencia:
              minutosAnticipacion <= 5
                ? 'Se recomienda REGALAR (son pocos minutos)'
                : 'Se recomienda ADELANTAR o REGALAR según política',
          },
        };
      }

      if (dto.adelantar_horario === true) {
        // Adelantar horario
        const duracionOriginal =
          reserva.fechaFin.getTime() - reserva.fechaInicio.getTime();
        reserva.fechaInicio = ahora;
        reserva.fechaFin = new Date(ahora.getTime() + duracionOriginal);
        reserva.estado = EstadoReserva.CONSUMO;

        await ocuparCupo();
        const saved = await this.reservaRepo.save(reserva);

        return {
          reserva: saved,
          mensaje: `Horario adelantado y cupo ocupado. Ahora termina ${minutosAnticipacion} minutos antes.`,
        };
      }

      // Regalar minutos
      reserva.estado = EstadoReserva.CONSUMO;
      await ocuparCupo();
      const saved = await this.reservaRepo.save(reserva);

      return {
        reserva: saved,
        mensaje: `Se regalaron ${minutosAnticipacion} minutos y cupo ocupado. Mantiene su horario original.`,
      };
    }

    // Llegada puntual o durante el horario
    reserva.estado = EstadoReserva.CONSUMO;
    await ocuparCupo();
    const saved = await this.reservaRepo.save(reserva);

    return {
      reserva: saved,
      mensaje:
        minutosAnticipacion < 0
          ? 'Llegada registrada durante su horario reservado. Cupo ocupado.'
          : 'Llegada registrada puntualmente. Cupo ocupado.',
    };
  }

  async getReservasHoy(
    id_estacionamiento: number,
    estado?: string,
    dni?: string,
  ): Promise<{
    resumen: {
      total: number;
      pendientes: number;
      en_consumo: number;
      finalizadas: number;
      canceladas: number;
    };
    reservas: Reserva[];
  }> {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const queryBuilder = this.reservaRepo
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.vehiculo', 'vehiculo')
      .leftJoinAndSelect('vehiculo.tipoVehiculo', 'tipoVehiculo')
      .leftJoinAndSelect('reserva.usuario', 'usuario')
      .leftJoinAndSelect('reserva.estacionamiento', 'estacionamiento')
      .where('reserva.id_estacionamiento = :id_estacionamiento', {
        id_estacionamiento,
      })
      .andWhere(
        new Brackets((qb) => {
          // OPCIÓN 1: Reservas que inician hoy
          qb.where('reserva.fechaInicio BETWEEN :inicio AND :fin', {
            inicio: hoyInicio,
            fin: hoyFin,
          })
            // OPCIÓN 2: O están EN CONSUMO y aún no han finalizado
            .orWhere(
              '(reserva.estado = :estadoConsumo AND reserva.fechaFin >= :inicio)',
              {
                estadoConsumo: EstadoReserva.CONSUMO,
                inicio: hoyInicio,
              },
            );
        }),
      );

    if (dni && dni.trim() !== '') {
      queryBuilder.andWhere('usuario.dni LIKE :dni', { dni: `%${dni}%` });
    }

    const todasReservas = await queryBuilder
      .orderBy('reserva.fechaInicio', 'ASC')
      .getMany();

    // Actualizar estados dinámicamente
    todasReservas.forEach((r) => {
      r.estado = this.calcularEstadoActual(r);
    });

    const resumen = {
      total: todasReservas.length,
      pendientes: todasReservas.filter(
        (r) => r.estado === EstadoReserva.PENDIENTE,
      ).length,
      en_consumo: todasReservas.filter(
        (r) => r.estado === EstadoReserva.CONSUMO,
      ).length,
      finalizadas: todasReservas.filter(
        (r) => r.estado === EstadoReserva.FINALIZADO,
      ).length,
      canceladas: todasReservas.filter(
        (r) => r.estado === EstadoReserva.CANCELADO,
      ).length,
    };

    let reservasFiltradas = todasReservas;
    if (estado) {
      const estadoUpper = estado.toUpperCase();
      reservasFiltradas = todasReservas.filter((r) => r.estado === estadoUpper);
    }

    return {
      resumen,
      reservas: reservasFiltradas,
    };
  }
  async findByUsuarioId(idUsuario: number): Promise<Reserva[]> {
    const reservas = await this.reservaRepo.find({
      where: { usuario: { id: idUsuario } },
      relations: [
        'vehiculo',
        'vehiculo.tipoVehiculo',
        'estacionamiento',
        'usuario',
      ],
      order: { fechaInicio: 'DESC' },
    });

    reservas.forEach((r) => (r.estado = this.calcularEstadoActual(r)));

    return reservas;
  }
  private async recalcularCuposEstacionamiento(
    idEstacionamiento: number,
  ): Promise<void> {
    this.logger.log(
      `❱❱❱ Iniciando recálculo para estacionamiento ${idEstacionamiento}`,
    );

    const cupos = await this.cupoVehiculoRepo.find({
      where: { estacionamiento: { id_estacionamiento: idEstacionamiento } },
    });

    this.logger.log(`❱❱❱ Cupos encontrados: ${cupos.length}`);
    cupos.forEach((c) => {
      this.logger.log(
        `   - ${c.tipo_vehiculo}: ${c.cupos_disponibles}/${c.cupos_totales}`,
      );
    });

    const totales = cupos.reduce((sum, c) => sum + c.cupos_totales, 0);
    const disponibles = cupos.reduce((sum, c) => sum + c.cupos_disponibles, 0);

    this.logger.log(`❱❱❱ Resultado recálculo: ${disponibles}/${totales}`);

    await this.estacionamientoRepo.update(idEstacionamiento, {
      cupos_totales: totales,
      cupos_disponibles: disponibles,
    });

    this.logger.log(
      `❱❱❱ Estacionamiento ${idEstacionamiento} actualizado en BD`,
    );

    const estacionamientoActualizado = await this.estacionamientoRepo.findOne({
      where: { id_estacionamiento: idEstacionamiento },
    });

    this.logger.log(`❱❱❱ Verificación después de guardar:`);
    this.logger.log(
      `   - cupos_disponibles: ${estacionamientoActualizado?.cupos_disponibles}`,
    );
    this.logger.log(
      `   - cupos_totales: ${estacionamientoActualizado?.cupos_totales}`,
    );
  }
}
