import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Put,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PagoService } from './pago.service';
import { CreatePagoDto, UpdatePagoDto } from './dto/pago.dto';
import { Pago } from './pago.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp?: string;
}

@Controller('pagos')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async create(@Body() dto: CreatePagoDto): Promise<ApiResponse<any>> {
    const result = await this.pagoService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Pago creado exitosamente',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('cancelar/:id_reserva')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async cancelar(
    @Param('id_reserva', ParseIntPipe) id_reserva: number,
    @Body() body?: { paymentIntentId?: string },
  ): Promise<ApiResponse<null>> {
    await this.pagoService.cancelarPagoYReserva(
      id_reserva,
      body?.paymentIntentId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva cancelada por el usuario',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  async findAll(): Promise<ApiResponse<Pago[]>> {
    const pagos = await this.pagoService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Lista de pagos',
      data: pagos,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.CONDUCTOR)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Pago>> {
    const pago = await this.pagoService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pago encontrado',
      data: pago,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePagoDto,
  ): Promise<ApiResponse<Pago>> {
    const pago = await this.pagoService.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pago actualizado correctamente',
      data: pago,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('confirmar')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async confirmarPago(
    @Body() body: { paymentIntentId: string; paymentMethodId?: string },
  ): Promise<ApiResponse<any>> {
    const result = await this.pagoService.confirmarPago(
      body.paymentIntentId,
      body.paymentMethodId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  }
}
