import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EstacionamientoServicio } from '../estacionamiento-servicio/estacionamiento-servicio.entity';

@Entity('servicio')
export class Servicio {
  @PrimaryGeneratedColumn()
  id_servicio: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @OneToMany(() => EstacionamientoServicio, (es) => es.servicio)
  estacionamientos: EstacionamientoServicio[];
}
