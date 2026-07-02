import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { TipoVehiculoService } from './tipo-vehiculo.service';
import { CreateTipoVehiculoDto } from './dto/create-tipo-vehiculo.dto';
import { UpdateTipoVehiculoDto } from './dto/update-tipo-vehiculo.dto';
import { TipoVehiculo } from './tipo-vehiculo.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('tipo-vehiculo')
export class TipoVehiculoController {
  constructor(private readonly tipoVehiculoService: TipoVehiculoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTipoVehiculoDto) {
    console.log('DTO recibido:', dto);
    const tipo = await this.tipoVehiculoService.create(dto);
    return {
      message: 'Tipo de vehículo creado exitosamente',
      data: tipo,
    };
  }

  @Get()
  async findAll(): Promise<{
    message: string;
    data: TipoVehiculo[];
    count: number;
  }> {
    const tipos = await this.tipoVehiculoService.findAll();
    return {
      message: 'Lista de tipos de vehículo obtenida exitosamente',
      data: tipos,
      count: tipos.length,
    };
  }

  @Get('buscar')
  async findByName(
    @Query('nombre') nombre: string,
  ): Promise<{ message: string; data: TipoVehiculo[]; count: number }> {
    const tipos = await this.tipoVehiculoService.findByName(nombre);
    return {
      message: `Búsqueda completada para "${nombre}"`,
      data: tipos,
      count: tipos.length,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; data: TipoVehiculo }> {
    const tipo = await this.tipoVehiculoService.findOne(id);
    return {
      message: 'Tipo de vehículo encontrado exitosamente',
      data: tipo,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoVehiculoDto,
  ): Promise<{ message: string; data: TipoVehiculo }> {
    const tipo = await this.tipoVehiculoService.update(id, dto);
    return {
      message: 'Tipo de vehículo actualizado exitosamente',
      data: tipo,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.tipoVehiculoService.remove(id);
    return {
      message: 'Tipo de vehículo eliminado exitosamente',
    };
  }
}
