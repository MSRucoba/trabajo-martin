import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Vehiculo } from '../vehiculo/vehiculo.entity';

@Entity({ name: 'tipo_vehiculo' })
export class TipoVehiculo {
  @PrimaryGeneratedColumn({ name: 'id_tipo_vehiculo' })
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.tipoVehiculo)
  vehiculos: Vehiculo[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizarNombre() {
    if (this.nombre) {
      this.nombre = this.nombre.trim().toUpperCase();
    }
  }
}
