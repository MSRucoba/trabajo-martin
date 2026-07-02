import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehiculo } from '../vehiculo/vehiculo.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { EstadoReserva } from './enums/estado-reserva.enum';
import { Usuario } from '../usuario/usuario.entity';

@Entity({ name: 'reserva' })
@Index('idx_reserva_fechas', ['fechaInicio', 'fechaFin'])
@Index('idx_reserva_estado', ['estado'])
@Index('idx_reserva_codigo', ['codigoReserva'])
export class Reserva {
  @PrimaryGeneratedColumn({ name: 'id_reserva' })
  id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.reservas, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Estacionamiento, (est) => est.reservas, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_estacionamiento' })
  estacionamiento: Estacionamiento;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.reservas, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_vehiculo' })
  vehiculo: Vehiculo;

  @Column({
    name: 'fecha_reserva',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaReserva: Date;

  @Column({ name: 'fecha_inicio', type: 'timestamp' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp' })
  fechaFin: Date;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.PENDIENTE,
  })
  estado: EstadoReserva;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'tipo_tarifa', type: 'varchar', length: 20, nullable: true })
  tipo_tarifa: string;
  @Column({
    name: 'codigo_reserva',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  codigoReserva: string;
}
