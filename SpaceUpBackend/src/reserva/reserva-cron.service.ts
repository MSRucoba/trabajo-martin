import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservaService } from './reserva.service';

@Injectable()
export class ReservaCronService {
  private readonly logger = new Logger(ReservaCronService.name);

  constructor(private readonly reservaService: ReservaService) {}

  // Se ejecuta cada minuto
  @Cron(CronExpression.EVERY_MINUTE)
  async actualizarEstadosAutomaticamente() {
    try {
      this.logger.log('Ejecutando actualización automática de estados...');

      const result = await this.reservaService.actualizarEstados();

      if (result.actualizadas > 0) {
        this.logger.log(`${result.actualizadas} reservas actualizadas`);
      }
    } catch (error) {
      this.logger.error('Error en actualización automática:', error);
    }
  }
}
