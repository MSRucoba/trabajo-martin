import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './vehiculo.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

interface ApiResponse<T> {
  message: string;
  data?: T;
  count?: number;
}

@Controller('vehiculos')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateVehiculoDto): Promise<ApiResponse<Vehiculo>> {
    const vehiculo = await this.vehiculoService.create(dto);
    return {
      message: 'Vehículo creado exitosamente',
      data: vehiculo,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async findAll(): Promise<ApiResponse<Vehiculo[]>> {
    const vehiculos = await this.vehiculoService.findAll();
    return {
      message: 'Lista de vehículos obtenida exitosamente',
      count: vehiculos.length,
      data: vehiculos,
    };
  }

  @Get('usuario/:id/stats')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async getVehicleStats(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<
    ApiResponse<{ total: number; activos: number; inactivos: number }>
  > {
    const stats = await this.vehiculoService.getVehicleStats(id);
    return {
      message: 'Estadísticas de vehículos obtenidas exitosamente',
      data: stats,
    };
  }

  @Get('usuario/:id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async findByUser(
    @Param('id', ParseIntPipe) id: number,
    @Query('incluir_inactivos') incluirInactivos?: string,
  ): Promise<ApiResponse<Vehiculo[]>> {
    const vehiculos =
      incluirInactivos === 'true'
        ? await this.vehiculoService.findByUser(id)
        : await this.vehiculoService.findActiveByUser(id);

    return {
      message: 'Vehículos del usuario obtenidos exitosamente',
      count: vehiculos.length,
      data: vehiculos,
    };
  }

  @Get('validar/:id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async canMakeReservation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; canReserve: boolean }> {
    const canReserve = await this.vehiculoService.canMakeReservation(id);
    return {
      message: 'Validación de reserva completada',
      canReserve,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Vehiculo>> {
    const vehiculo = await this.vehiculoService.findOne(id);
    return {
      message: 'Vehículo encontrado exitosamente',
      data: vehiculo,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehiculoDto,
  ): Promise<ApiResponse<Vehiculo>> {
    const vehiculo = await this.vehiculoService.update(id, dto);
    return {
      message: 'Vehículo actualizado exitosamente',
      data: vehiculo,
    };
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Vehiculo>> {
    const vehiculo = await this.vehiculoService.deactivate(id);
    return {
      message: 'Vehículo desactivado exitosamente',
      data: vehiculo,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.vehiculoService.remove(id);
    return {
      message: 'Vehículo eliminado exitosamente',
    };
  }
}
