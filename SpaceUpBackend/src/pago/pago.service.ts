import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './pago.entity';
import { CreatePagoDto, UpdatePagoDto } from './dto/pago.dto';
import { Reserva } from '../reserva/reserva.entity';
import { StripeService } from '../util/stripe.service';
import { randomBytes } from 'crypto';
import { EstadoReserva } from '../reserva/enums/estado-reserva.enum';
import { BilleteraPago } from '../billetera-pago/billetera-pago.entity';

@Injectable()
export class PagoService {
  private readonly logger = new Logger(PagoService.name);

  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,

    @InjectRepository(BilleteraPago)
    private readonly billeteraRepo: Repository<BilleteraPago>,

    private readonly stripeService: StripeService,
  ) {}

  async create(
    dto: CreatePagoDto,
  ): Promise<{ pago: Pago; clientSecret: string }> {
    this.logger.log(
      `❱❱❱ [PagoService.create] Iniciando creación de pago para reserva ${dto.id_reserva}`,
    );

    const reserva = await this.reservaRepo.findOne({
      where: { id: dto.id_reserva },
      relations: [
        'vehiculo',
        'vehiculo.usuario',
        'vehiculo.tipoVehiculo',
        'estacionamiento',
        'estacionamiento.tarifas',
      ],
    });

    if (!reserva) {
      this.logger.error(`❱❱❱ Reserva ${dto.id_reserva} no encontrada`);
      throw new NotFoundException(
        `Reserva con ID ${dto.id_reserva} no encontrada`,
      );
    }

    this.logger.log(`🔹 Reserva encontrada: ID ${reserva.id}`);
    this.logger.log(`   - Usuario: ${reserva.vehiculo?.usuario?.id}`);
    this.logger.log(`   - Vehículo: ${reserva.vehiculo?.id}`);
    this.logger.log(
      `   - Tipo vehículo: ${reserva.vehiculo?.tipoVehiculo?.nombre}`,
    );
    this.logger.log(`   - Tipo tarifa: ${reserva.tipo_tarifa}`);

    const pagoExistente = await this.pagoRepo.findOne({
      where: { reserva: { id: dto.id_reserva }, status: 'succeeded' },
    });
    if (pagoExistente) {
      this.logger.warn(
        `❱❱❱ La reserva ${dto.id_reserva} ya tiene un pago exitoso`,
      );
      throw new ConflictException('Esta reserva ya fue pagada.');
    }

    const usuario = reserva.vehiculo?.usuario;
    if (!usuario) {
      this.logger.error(
        `❱❱❱ Usuario no encontrado en la reserva ${dto.id_reserva}`,
      );
      throw new BadRequestException(
        'No se pudo obtener el usuario de la reserva',
      );
    }

    const tipoVehiculo = reserva.vehiculo?.tipoVehiculo?.nombre;
    if (!tipoVehiculo) {
      this.logger.error(`❱❱❱ Tipo de vehículo no encontrado`);
      throw new BadRequestException('El vehículo no tiene tipo asignado');
    }

    const tipoTarifa = reserva.tipo_tarifa || 'HORA';
    this.logger.log(`❱❱❱ Buscando tarifa: ${tipoVehiculo} - ${tipoTarifa}`);

    if (
      !reserva.estacionamiento?.tarifas ||
      reserva.estacionamiento.tarifas.length === 0
    ) {
      this.logger.error(
        `❱❱❱ No se cargaron las tarifas del estacionamiento ${reserva.estacionamiento?.id_estacionamiento}`,
      );
      throw new BadRequestException(
        'No se pudieron cargar las tarifas del estacionamiento',
      );
    }

    this.logger.log(
      `❱❱❱ Tarifas disponibles: ${reserva.estacionamiento.tarifas.length}`,
    );
    reserva.estacionamiento.tarifas.forEach((t) => {
      this.logger.log(
        `   - ${t.tipo_vehiculo} / ${t.tipo_tarifa}: S/.${t.monto}`,
      );
    });

    const tarifa = reserva.estacionamiento.tarifas.find(
      (t) => t.tipo_vehiculo === tipoVehiculo && t.tipo_tarifa === tipoTarifa,
    );

    if (!tarifa) {
      this.logger.error(
        `❱❱❱ No se encontró tarifa para ${tipoVehiculo} (${tipoTarifa})`,
      );
      throw new BadRequestException(
        `No se encontró una tarifa para ${tipoVehiculo} (${tipoTarifa}) en este estacionamiento.`,
      );
    }

    this.logger.log(`❱❱❱ Tarifa encontrada: S/.${tarifa.monto}`);

    let montoCalculado = 0;
    const horasTotales =
      (reserva.fechaFin.getTime() - reserva.fechaInicio.getTime()) /
      (1000 * 60 * 60);

    this.logger.log(`🔹 Calculando monto. Duración: ${horasTotales} horas`);

    switch (tipoTarifa) {
      case 'HORA':
        montoCalculado = tarifa.monto * Math.ceil(horasTotales);
        break;
      case 'DIA':
        montoCalculado = tarifa.monto * Math.ceil(horasTotales / 24);
        break;
      case 'SEMANA':
        montoCalculado = tarifa.monto * Math.ceil(horasTotales / (24 * 7));
        break;
      case 'MES':
        montoCalculado = tarifa.monto * Math.ceil(horasTotales / (24 * 30));
        break;
      default:
        this.logger.error(`❱❱❱ Tipo de tarifa no reconocido: ${tipoTarifa}`);
        throw new BadRequestException(
          `Tipo de tarifa no reconocido: ${tipoTarifa}`,
        );
    }

    const montoFront = Math.round(dto.monto * 100);
    const montoReal = Math.round(montoCalculado * 100);
    this.logger.log(
      `❱❱❱ Comparando monto: front=${dto.monto} (${montoFront} cents) vs real=${montoCalculado} (${montoReal} cents)`,
    );

    if (montoFront !== montoReal) {
      this.logger.error(
        `❱❱❱ Monto inválido. Esperado: ${montoCalculado}, Recibido: ${dto.monto}`,
      );
      throw new ConflictException(
        `Monto inválido. El total correcto es S/.${montoCalculado.toFixed(2)}`,
      );
    }

    this.logger.log(
      `❱❱❱ Verificando/creando customer de Stripe para usuario ${usuario.id}`,
    );
    let customerId = usuario.stripeCustomerId;

    if (!customerId) {
      this.logger.log(
        `❱❱❱ Usuario no tiene stripeCustomerId, creando en Stripe...`,
      );
      try {
        customerId = await this.stripeService.createCustomer(
          usuario.email,
          `${usuario.nombre} ${usuario.apellido}`,
        );
        usuario.stripeCustomerId = customerId;
        this.logger.log(`❱❱❱ Customer creado en Stripe: ${customerId}`);
      } catch (error) {
        this.logger.error(
          `❱❱❱ Error creando customer en Stripe: ${error.message}`,
        );
        throw new BadRequestException(
          `Error al crear customer en Stripe: ${error.message}`,
        );
      }
    } else {
      this.logger.log(`❱❱❱ Usuario ya tiene stripeCustomerId: ${customerId}`);
    }

    this.logger.log(`❱❱❱ Creando PaymentIntent en Stripe...`);
    let paymentIntent;
    try {
      paymentIntent = await this.stripeService.createPaymentIntent(
        dto.monto,
        customerId,
        'usd',
      );
      this.logger.log(`❱❱❱ PaymentIntent creado: ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`❱❱❱ Error creando PaymentIntent: ${error.message}`);
      throw new BadRequestException(
        `Error al crear PaymentIntent en Stripe: ${error.message}`,
      );
    }

    const montoCents = Math.round(dto.monto * 100);
    const commissionCents = Math.round(montoCents * 0.15);
    const netAmountCents = montoCents - commissionCents;
    const voucherCode = await this.generarVoucherUnico();

    this.logger.log(`❱❱❱ Guardando pago en BD...`);
    const pago = this.pagoRepo.create({
      reserva,
      monto: dto.monto,
      stripePaymentIntentId: paymentIntent.id,
      currency: paymentIntent.currency,
      commissionCents,
      netAmountCents,
      status: paymentIntent.status,
      voucherCode,
      metadata: paymentIntent,
    });

    const pagoGuardado = await this.pagoRepo.save(pago);
    this.logger.log(`❱❱❱ Pago creado exitosamente: ID ${pagoGuardado.id}`);
    this.logger.log(`   - Monto: ${dto.monto} ${paymentIntent.currency}`);
    this.logger.log(`   - PaymentIntent: ${paymentIntent.id}`);
    this.logger.log(
      `   - ClientSecret: ${paymentIntent.client_secret ? 'Generado' : 'NO GENERADO'}`,
    );

    return {
      pago: pagoGuardado,
      clientSecret: paymentIntent.client_secret || '',
    };
  }

  private async generarVoucherUnico(): Promise<string> {
    let code: string;
    let exists: boolean;
    do {
      code = `PAY-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex')}`;
      exists = !!(await this.pagoRepo.findOne({
        where: { voucherCode: code },
      }));
    } while (exists);
    return code;
  }

  async confirmarPago(paymentIntentId: string, paymentMethodId?: string) {
    const pago = await this.pagoRepo.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['reserva', 'reserva.vehiculo', 'reserva.estacionamiento'],
    });
    if (!pago) throw new NotFoundException('Pago no encontrado.');

    if (pago.status === 'succeeded') {
      this.logger.log(`❱❱❱ Pago ${pago.id} ya estaba confirmado anteriormente`);
      return { message: 'Pago ya confirmado exitosamente', data: pago };
    }

    const paymentIntent = await this.stripeService.confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId,
    );

    if (paymentIntent.status === 'succeeded') {
      pago.status = 'succeeded';
      pago.fechaPago = new Date();
      pago.metadata = paymentIntent;

      if (pago.reserva) {
        pago.reserva.estado = EstadoReserva.PENDIENTE;
        await this.reservaRepo.save(pago.reserva);
      }

      await this.pagoRepo.save(pago);
      this.logger.log(`❱❱❱ Pago ${pago.id} confirmado con éxito`);
      return { message: 'Pago confirmado exitosamente', data: pago };
    }

    pago.status = paymentIntent.status;
    pago.mensajeError = paymentIntent.last_payment_error?.message ?? null;
    await this.pagoRepo.save(pago);
    this.logger.warn(
      `❱❱❱ Pago ${pago.id} no confirmado (${paymentIntent.status})`,
    );
    return {
      message: `El pago se encuentra en estado ${paymentIntent.status}`,
      data: paymentIntent,
    };
  }

  async cancelarPagoYReserva(id_reserva: number, paymentIntentId?: string) {
    const reserva = await this.reservaRepo.findOne({
      where: { id: id_reserva },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    if (paymentIntentId) {
      try {
        await this.stripeService.cancelPaymentIntent(paymentIntentId);
        this.logger.log(
          `❱❱❱ PaymentIntent ${paymentIntentId} cancelado en Stripe`,
        );
      } catch (error) {
        this.logger.warn(
          `❱❱❱ No se pudo cancelar PaymentIntent: ${error.message}`,
        );
      }
    }

    await this.reservaRepo.update(id_reserva, {
      estado: EstadoReserva.CANCELADO,
    });
    this.logger.warn(
      `❱❱❱ Reserva ${id_reserva} marcada como CANCELADA por cancelación de pago.`,
    );
  }

  async findAll(): Promise<Pago[]> {
    return this.pagoRepo.find({
      relations: ['reserva'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagoRepo.findOne({
      where: { id },
      relations: ['reserva'],
    });
    if (!pago) throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    return pago;
  }

  async update(id: number, dto: UpdatePagoDto): Promise<Pago> {
    const pago = await this.findOne(id);
    Object.assign(pago, dto);
    return this.pagoRepo.save(pago);
  }
}
