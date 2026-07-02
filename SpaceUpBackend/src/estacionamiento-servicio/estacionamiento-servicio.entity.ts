import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Column,
  JoinColumn,
} from 'typeorm';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { Servicio } from '../servicio/servicio.entity';

@Entity('estacionamiento_servicio')
@Unique(['estacionamiento', 'servicio'])
export class EstacionamientoServicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  estado: boolean;

  @ManyToOne(() => Estacionamiento, (est) => est.servicios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_estacionamiento' })
  estacionamiento: Estacionamiento;

  @ManyToOne(() => Servicio, (serv) => serv.estacionamientos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_servicio' })
  servicio: Servicio;
}
