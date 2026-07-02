import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Reserva } from '../reserva/reserva.entity';

@Entity({ name: 'pago' })
@Index(['transactionId'])
export class Pago {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  @OneToOne(() => Reserva, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'stripe_payment_intent_id', length: 100, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ name: 'currency', length: 10, default: 'mxn' })
  currency: string;

  @Column({ name: 'commission_cents', type: 'int', default: 0 })
  commissionCents: number;

  @Column({ name: 'net_amount_cents', type: 'int', default: 0 })
  netAmountCents: number;

  @Column({ name: 'status', length: 50, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp' })
  fechaActualizacion: Date;

  @Column({ name: 'fecha_pago', type: 'timestamp', nullable: true })
  fechaPago?: Date;

  @Column({ name: 'voucher_code', length: 50, unique: true })
  voucherCode: string;

  @Column({ name: 'transaction_id', length: 100, nullable: true })
  transactionId?: string;

  @Column({ name: 'session_id', length: 100, nullable: true })
  sessionId?: string;

  @Column({ name: 'mensaje_error', type: 'text', nullable: true })
  mensajeError?: string | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: any;
}
