import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HasRoles } from '../auth/jwt/has-role';
import { JwtRole } from '../auth/jwt/jwt-role';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { JwtRolesGuard } from '../auth/jwt/jwt-roles.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('web/logs')
@UseGuards(JwtAuthGuard, JwtRolesGuard)
@HasRoles(JwtRole.ADMIN)
export class LogsController {
  private logPath = path.join(process.cwd(), 'logs', 'application.log');

  @Get('tail')
  async obtenerUltimosLogs(@Query('lines') lines?: number) {
    try {
      const lineas = parseInt(lines as any) || 100;

      if (!fs.existsSync(this.logPath)) {
        return {
          success: true,
          data: {
            logs: ['No hay logs disponibles aún'],
            total: 0,
          },
        };
      }

      const content = fs.readFileSync(this.logPath, 'utf-8');
      const allLines = content.split('\n').filter((l) => l.trim());
      const lastLines = allLines.slice(-lineas);

      return {
        success: true,
        data: {
          logs: lastLines,
          total: allLines.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al leer logs',
        error: error.message,
      };
    }
  }

  @Get('search')
  async buscarEnLogs(@Query('query') query: string) {
    try {
      if (!fs.existsSync(this.logPath)) {
        return {
          success: true,
          data: { logs: [], total: 0 },
        };
      }

      const content = fs.readFileSync(this.logPath, 'utf-8');
      const allLines = content.split('\n');
      const filteredLines = allLines.filter((line) =>
        line.toLowerCase().includes(query.toLowerCase()),
      );

      return {
        success: true,
        data: {
          logs: filteredLines,
          total: filteredLines.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al buscar en logs',
        error: error.message,
      };
    }
  }

  @Get('clear')
  async limpiarLogs() {
    try {
      if (fs.existsSync(this.logPath)) {
        fs.writeFileSync(this.logPath, '');
      }

      return {
        success: true,
        message: 'Logs limpiados correctamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al limpiar logs',
        error: error.message,
      };
    }
  }
}
