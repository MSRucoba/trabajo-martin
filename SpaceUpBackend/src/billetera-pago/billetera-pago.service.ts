import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BilleteraPago } from './billetera-pago.entity';
import { CreateBilleteraPagoDto } from './dto/create-billetera-pago.dto';
import { Usuario } from '../usuario/usuario.entity';
import { StripeService } from '../util/stripe.service';

@Injectable()
export class BilleteraPagoService {
  constructor(
    @InjectRepository(BilleteraPago)
    private readonly billeteraRepo: Repository<BilleteraPago>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly stripeService: StripeService,
  ) {}

  async create(dto: CreateBilleteraPagoDto): Promise<BilleteraPago> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: dto.id_usuario },
    });

    if (!usuario)
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado`,
      );

    const existe = await this.billeteraRepo.findOne({
      where: {
        stripePaymentMethodId: dto.stripePaymentMethodId,
        usuario: { id: dto.id_usuario },
      },
    });

    if (existe)
      throw new ConflictException('Ya tienes esta tarjeta registrada.');

    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    if (
      dto.expYear < anioActual ||
      (dto.expYear === anioActual && dto.expMonth < mesActual)
    ) {
      throw new BadRequestException(
        'La tarjeta está vencida. Usa una tarjeta válida.',
      );
    }

    if (!usuario.stripeCustomerId) {
      const customerId = await this.stripeService.createCustomer(
        usuario.email,
        `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim(),
      );
      usuario.stripeCustomerId = customerId;
      await this.usuarioRepo.save(usuario);
    }

    if (dto.predeterminado) {
      await this.billeteraRepo.update(
        { usuario: { id: dto.id_usuario } },
        { predeterminado: false },
      );
    }

    const nuevoMetodo = this.billeteraRepo.create({
      usuario,
      stripePaymentMethodId: dto.stripePaymentMethodId,
      brand: dto.brand,
      last4: dto.last4,
      expMonth: dto.expMonth,
      expYear: dto.expYear,
      predeterminado: dto.predeterminado || false,
    });

    await this.stripeService.attachPaymentMethod(
      dto.stripePaymentMethodId,
      usuario.stripeCustomerId,
    );

    return this.billeteraRepo.save(nuevoMetodo);
  }

  async getByUsuario(id_usuario: number): Promise<BilleteraPago[]> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: id_usuario },
    });
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    return this.billeteraRepo.find({
      where: { usuario: { id: id_usuario } },
      order: { predeterminado: 'DESC', fechaCreacion: 'DESC' },
    });
  }

  async setPredeterminada(
    id_usuario: number,
    id_billetera: number,
  ): Promise<BilleteraPago> {
    const metodo = await this.billeteraRepo.findOne({
      where: { id: id_billetera, usuario: { id: id_usuario } },
    });

    if (!metodo) throw new NotFoundException('Método de pago no encontrado.');

    await this.billeteraRepo.update(
      { usuario: { id: id_usuario } },
      { predeterminado: false },
    );
    metodo.predeterminado = true;

    return this.billeteraRepo.save(metodo);
  }

  async delete(id_usuario: number, id_billetera: number): Promise<void> {
    const metodo = await this.billeteraRepo.findOne({
      where: { id: id_billetera, usuario: { id: id_usuario } },
    });

    if (!metodo) throw new NotFoundException('Método de pago no encontrado.');

    try {
      await this.stripeService.detachPaymentMethod(
        metodo.stripePaymentMethodId,
      );
    } catch (error) {
      console.warn(`❱❱❱ No se pudo desvincular en Stripe: ${error.message}`);
    }

    await this.billeteraRepo.delete(id_billetera);
  }

  async countByUsuario(id_usuario: number): Promise<number> {
    return this.billeteraRepo.count({
      where: { usuario: { id: id_usuario } },
    });
  }
}
