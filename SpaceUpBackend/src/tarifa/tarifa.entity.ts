import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { TipoTarifa } from './tipo-tarifa.enum';

@Entity('tarifa')
export class Tarifa {
  @PrimaryGeneratedColumn()
  id_tarifa: number;

  @Column({ type: 'varchar', length: 50 })
  tipo_vehiculo: string;

  @Column({
    type: 'enum',
    enum: TipoTarifa,
    default: TipoTarifa.HORA,
  })
  tipo_tarifa: TipoTarifa;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @ManyToOne(
    () => Estacionamiento,
    (estacionamiento) => estacionamiento.tarifas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'id_estacionamiento' })
  estacionamiento: Estacionamiento;
}
