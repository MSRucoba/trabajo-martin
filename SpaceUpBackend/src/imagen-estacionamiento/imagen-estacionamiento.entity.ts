import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Estacionamiento } from 'src/estacionamiento/estacionamiento.entity';
import { ImagenTipo } from './imagen-tipo.enum';

@Entity('imagenes_estacionamiento')
export class ImagenEstacionamiento {
  @PrimaryGeneratedColumn()
  id_imagen: number;

  @Column()
  id_estacionamiento: number;

  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'enum',
    enum: ImagenTipo,
  })
  tipo: ImagenTipo;

  @CreateDateColumn()
  fecha_subida: Date;

  @ManyToOne(
    () => Estacionamiento,
    (estacionamiento) => estacionamiento.imagenes,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_estacionamiento' })
  estacionamiento: Estacionamiento;
}
