import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { GenerarReporteDto } from './dto/generar-reporte.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { JwtRolesGuard } from '../auth/jwt/jwt-roles.guard';
import { HasRoles } from '../auth/jwt/has-role';
import { JwtRole } from '../auth/jwt/jwt-role';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post('generar')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  async generarReporte(
    @Body() dto: GenerarReporteDto,
    @Res() res: any,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.reportesService.generarReporte(dto);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte-${dto.vista}-${Date.now()}.pdf`,
      );
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar reporte',
        error: error.message,
      });
    }
  }
}
