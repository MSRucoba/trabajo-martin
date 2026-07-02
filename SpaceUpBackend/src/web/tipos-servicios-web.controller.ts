import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TiposServiciosWebService } from './tipos-servicios-web.service';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('web/tipos-servicios-admin')
export class TiposServiciosWebController {
  constructor(
    private readonly tiposServiciosWebService: TiposServiciosWebService,
  ) {}

  @Get('tipos-vehiculo')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getTiposVehiculoConUsage(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const result = await this.tiposServiciosWebService.getTiposVehiculoConUsage(
      page || 1,
      limit || 10,
    );
    return {
      success: true,
      message: 'Tipos de vehículo obtenidos correctamente',
      data: result,
    };
  }

  @Get('servicios')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getServiciosConUsage(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const result = await this.tiposServiciosWebService.getServiciosConUsage(
      page || 1,
      limit || 10,
    );
    return {
      success: true,
      message: 'Servicios obtenidos correctamente',
      data: result,
    };
  }
}
