import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardWebService } from './dashboard-web.service';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('web/dashboard')
export class DashboardWebController {
  constructor(private readonly dashboardService: DashboardWebService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getStats(): Promise<any> {
    const stats = await this.dashboardService.getStats();
    return {
      success: true,
      message: 'Estadísticas del dashboard obtenidas',
      data: stats,
    };
  }
}
