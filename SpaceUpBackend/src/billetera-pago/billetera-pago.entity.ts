import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Entity({ name: 'billetera_pago' })
@Index(['stripePaymentMethodId'])
export class BilleteraPago {
  @PrimaryGeneratedColumn({ name: 'id_billetera_pago' })
  id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'stripe_payment_method_id', length: 100 })
  stripePaymentMethodId: string;

  @Column({ name: 'brand', length: 50 })
  brand: string;

  @Column({ name: 'last4', length: 4 })
  last4: string;

  @Column({ name: 'exp_month', type: 'int' })
  expMonth: number;

  @Column({ name: 'exp_year', type: 'int' })
  expYear: number;

  @Column({ name: 'predeterminado', type: 'boolean', default: false })
  predeterminado: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
