import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReservasWebService } from './reserva-web.service';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('web/reservas-admin')
export class ReservasWebController {
  constructor(private readonly reservasWebService: ReservasWebService) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getAllWithPagination(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const result = await this.reservasWebService.getAllWithDetails(
      page || 1,
      limit || 10,
    );
    return {
      success: true,
      message: 'Reservas obtenidas correctamente',
      data: result,
    };
  }
}
