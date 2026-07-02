import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EstacionamientoServicio } from '../estacionamiento-servicio/estacionamiento-servicio.entity';
import { Tarifa } from '../tarifa/tarifa.entity';
import { Reserva } from '../reserva/reserva.entity';
import { ImagenEstacionamiento } from '../imagen-estacionamiento/imagen-estacionamiento.entity';
import { CupoVehiculo } from '../cupo-vehiculo/cupo-vehiculo.entity';

@Entity('estacionamiento')
export class Estacionamiento {
  @PrimaryGeneratedColumn()
  id_estacionamiento: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column('varchar', { length: 255, nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  telefono: string;

  @Column('decimal', { precision: 10, scale: 6 })
  latitud: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitud: number;

  @Column({ type: 'int', default: 0 })
  cupos_totales: number;

  @Column({ type: 'int', default: 0 })
  cupos_disponibles: number;

  @Column({ type: 'time', nullable: false })
  hora_apertura: string;

  @Column({ type: 'time', nullable: false })
  hora_cierre: string;

  @Column({ name: 'es_24h', type: 'boolean', default: false })
  es24h: boolean;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @Column({ type: 'int', nullable: true })
  id_encargado: number | null;

  @ManyToOne(() => Empresa, (empresa) => empresa.estacionamientos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'id_encargado', referencedColumnName: 'id' })
  encargado?: Usuario;

  @OneToMany(() => CupoVehiculo, (cupo) => cupo.estacionamiento, {
    cascade: true,
  })
  cuposVehiculo: CupoVehiculo[];

  @OneToMany(() => Tarifa, (tarifa) => tarifa.estacionamiento)
  tarifas: Tarifa[];

  @OneToMany(() => EstacionamientoServicio, (es) => es.estacionamiento)
  servicios: EstacionamientoServicio[];

  @OneToMany(() => Reserva, (reserva) => reserva.estacionamiento)
  reservas: Reserva[];

  @OneToMany(() => ImagenEstacionamiento, (imagen) => imagen.estacionamiento)
  imagenes: ImagenEstacionamiento[];
}
