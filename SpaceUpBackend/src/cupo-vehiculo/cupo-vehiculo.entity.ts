import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';

@Entity('cupo_vehiculo')
export class CupoVehiculo {
  @PrimaryGeneratedColumn()
  id_cupo_vehiculo: number;

  @ManyToOne(() => Estacionamiento, (est) => est.cuposVehiculo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_estacionamiento' })
  estacionamiento: Estacionamiento;

  @Column({ type: 'varchar', length: 50 })
  tipo_vehiculo: string;

  @Column({ type: 'int' })
  cupos_totales: number;

  @Column({ type: 'int', default: 0 })
  cupos_disponibles: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
