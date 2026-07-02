import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CupoVehiculoService } from './cupo-vehiculo.service';
import { CupoVehiculo } from './cupo-vehiculo.entity';
import { UpdateCupoVehiculoDto } from './dto/update-cupo-vehiculo.dto';
import { AjustarCupoVehiculoDto } from './dto/ajustar-cupo-vehiculo.dto';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('cupo-vehiculo')
export class CupoVehiculoController {
  constructor(private readonly cupoVehiculoService: CupoVehiculoService) {}

  @Get('estacionamiento/:id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findByEstacionamiento(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CupoVehiculo[]> {
    return this.cupoVehiculoService.findByEstacionamiento(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CupoVehiculo> {
    return this.cupoVehiculoService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCupoVehiculoDto,
  ): Promise<CupoVehiculo> {
    return this.cupoVehiculoService.update(id, dto);
  }

  @Patch('estacionamiento/:id/ajustar')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  ajustar(
    @Param('id', ParseIntPipe) idEstacionamiento: number,
    @Body() dto: AjustarCupoVehiculoDto,
  ): Promise<CupoVehiculo> {
    return this.cupoVehiculoService.ajustar(idEstacionamiento, dto);
  }

  @Get('estacionamiento/:id/disponibilidad/:tipo')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(
    JwtRole.ADMIN,
    JwtRole.ANFITRION,
    JwtRole.ENCARGADO,
    JwtRole.CONDUCTOR,
  )
  verificarDisponibilidad(
    @Param('id', ParseIntPipe) idEstacionamiento: number,
    @Param('tipo') tipoVehiculo: string,
  ): Promise<{ disponible: boolean; cupos: number }> {
    return this.cupoVehiculoService.verificarDisponibilidad(
      idEstacionamiento,
      tipoVehiculo,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cupoVehiculoService.remove(id);
  }
}
