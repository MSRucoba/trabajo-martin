import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PagosWebService } from './pago-web.service';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('web/pagos-admin')
export class PagosWebController {
  constructor(private readonly pagosWebService: PagosWebService) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getAllWithPagination(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const result = await this.pagosWebService.getAllWithDetails(
      page || 1,
      limit || 10,
    );
    return {
      success: true,
      message: 'Pagos obtenidos correctamente',
      data: result,
    };
  }

  @Get('ganancias-mes')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getGananciasDelMes(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<any> {
    const ganancias = await this.pagosWebService.getGananciasDelMes(
      year,
      month,
    );
    return {
      success: true,
      message: 'Ganancias del mes obtenidas',
      data: ganancias,
    };
  }
}
