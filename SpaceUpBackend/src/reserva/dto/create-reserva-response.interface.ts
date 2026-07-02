import { Pago } from '../../pago/pago.entity';
import { Reserva } from '../reserva.entity';

export interface CreateReservaResponse {
  reserva: Reserva;
  pago: Pago | null;
  clientSecret?: string;
  error?: string;
}
