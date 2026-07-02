import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservaService } from './reserva.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { Reserva } from './reserva.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { RegistrarLlegadaDto } from './dto/registrar-llegada.dto';
import { CreateReservaResponse } from './dto/create-reserva-response.interface';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

@Controller('reservas')
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async create(
    @Body() dto: CreateReservaDto,
  ): Promise<ApiResponse<CreateReservaResponse>> {
    const result = await this.reservaService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Reserva creada en estado Pendiente',
      data: {
        reserva: result.reserva,
        pago: result.pago,
        clientSecret: result.clientSecret,
        error: result.error,
      },
    };
  }

  @Get('previsualizar')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async previsualizar(
    @Query('id_estacionamiento', ParseIntPipe) id_estacionamiento: number,
    @Query('id_vehiculo', ParseIntPipe) id_vehiculo: number,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('tipo_tarifa') tipo_tarifa?: string,
    @Query('cantidad', new ParseIntPipe({ optional: true })) cantidad?: number,
  ): Promise<ApiResponse<{ monto: number; detalle: string }>> {
    const result = await this.reservaService.previsualizarMonto(
      id_estacionamiento,
      id_vehiculo,
      fechaInicio,
      fechaFin,
      tipo_tarifa,
      cantidad,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Precio previsualizado exitosamente',
      data: result,
    };
  }

  @Post('actualizar-estados')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ENCARGADO)
  async actualizarEstados(): Promise<ApiResponse<{ actualizadas: number }>> {
    const result = await this.reservaService.actualizarEstados();
    return {
      statusCode: HttpStatus.OK,
      message: `Se actualizaron ${result.actualizadas} reservas`,
      data: result,
    };
  }

  @Delete('cancelar/:id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Reserva>> {
    const reserva = await this.reservaService.cancelar(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva cancelada exitosamente',
      data: reserva,
    };
  }

  @Put('finalizar/:id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ENCARGADO)
  async finalizar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Reserva>> {
    const reserva = await this.reservaService.finalizar(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva finalizada exitosamente',
      data: reserva,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  async findAll(): Promise<ApiResponse<Reserva[]>> {
    const reservas = await this.reservaService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Lista de reservas obtenida exitosamente',
      data: reservas,
    };
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(
    JwtRole.ADMIN,
    JwtRole.ANFITRION,
    JwtRole.ENCARGADO,
    JwtRole.CONDUCTOR,
  )
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Reserva>> {
    const reserva = await this.reservaService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva encontrada',
      data: reserva,
    };
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservaDto,
  ): Promise<ApiResponse<Reserva>> {
    const reserva = await this.reservaService.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva actualizada exitosamente',
      data: reserva,
    };
  }
  @Post('registrar-llegada')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ENCARGADO)
  async registrarLlegada(
    @Body() dto: RegistrarLlegadaDto,
  ): Promise<ApiResponse<any>> {
    const result = await this.reservaService.registrarLlegada(dto);
    return {
      statusCode: HttpStatus.OK,
      message: result.mensaje,
      data: {
        reserva: result.reserva,
        ...(result.opciones && { opciones: result.opciones }),
      },
    };
  }
  @Get('hoy/:id_estacionamiento')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ENCARGADO)
  async getReservasHoy(
    @Param('id_estacionamiento', ParseIntPipe) id_estacionamiento: number,
    @Query('estado') estado?: string,
    @Query('dni') dni?: string,
  ): Promise<ApiResponse<any>> {
    const result = await this.reservaService.getReservasHoy(
      id_estacionamiento,
      estado,
      dni,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Reservas del día obtenidas',
      data: result,
    };
  }
  @Get('validar-codigo/:codigo')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ENCARGADO, JwtRole.CONDUCTOR, JwtRole.ADMIN)
  async validarCodigo(
    @Param('codigo') codigo: string,
  ): Promise<ApiResponse<any>> {
    if (!codigo) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El código de reserva es requerido',
      };
    }

    const result = await this.reservaService.validarCodigo(codigo);

    return {
      statusCode: result.valido ? HttpStatus.OK : HttpStatus.NOT_FOUND,
      message: result.mensaje,
      data: result.valido ? result.reserva : null,
    };
  }

  // Buscar por código
  @Get('codigo/:codigo')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ENCARGADO, JwtRole.CONDUCTOR, JwtRole.ADMIN)
  async findByCodigo(
    @Param('codigo') codigo: string,
  ): Promise<ApiResponse<Reserva>> {
    const reserva = await this.reservaService.findByCodigo(codigo);
    return {
      statusCode: HttpStatus.OK,
      message: 'Reserva encontrada',
      data: reserva,
    };
  }
  @Get('usuario/:userId')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.CONDUCTOR, JwtRole.ADMIN)
  async getReservasByUsuario(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ApiResponse<Reserva[]>> {
    const reservas = await this.reservaService.findByUsuarioId(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Reservas del usuario obtenidas exitosamente',
      data: reservas,
    };
  }
}
