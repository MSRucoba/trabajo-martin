import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EstacionamientoServicioService } from './estacionamiento-servicio.service';
import { CreateEstacionamientoServicioDto } from './dto/create-estacionamiento-servicio.dto';
import { UpdateEstacionamientoServicioDto } from './dto/update-estacionamiento-servicio.dto';
import { EstacionamientoServicio } from './estacionamiento-servicio.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('estacionamiento-servicio')
export class EstacionamientoServicioController {
  constructor(private readonly service: EstacionamientoServicioService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  create(
    @Body() dto: CreateEstacionamientoServicioDto,
  ): Promise<EstacionamientoServicio> {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findAll(@Req() req): Promise<EstacionamientoServicio[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EstacionamientoServicio> {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstacionamientoServicioDto,
  ): Promise<EstacionamientoServicio> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
