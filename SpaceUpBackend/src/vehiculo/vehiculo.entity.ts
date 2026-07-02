import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
  OneToMany,
} from 'typeorm';
import { TipoVehiculo } from 'src/tipo-vehiculo/tipo-vehiculo.entity';
import { Usuario } from 'src/usuario/usuario.entity';
import { VehiculoEstado } from './enums/vehiculo-estados.enum';
import { Reserva } from 'src/reserva/reserva.entity';

@Entity({ name: 'vehiculo' })
@Index(['usuario', 'estado'])
export class Vehiculo {
  @PrimaryGeneratedColumn({ name: 'id_vehiculo' })
  id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.vehiculos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => TipoVehiculo, (tipo) => tipo.vehiculos, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'id_tipo_vehiculo' })
  tipoVehiculo: TipoVehiculo;

  @Column({
    name: 'placa',
    length: 10,
    unique: true,
    transformer: {
      to: (value: string) => value?.toUpperCase(),
      from: (value: string) => value?.toUpperCase(),
    },
  })
  placa: string;
  @Column({
    name: 'apodo',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  apodo?: string;
  @Column({
    type: 'enum',
    enum: VehiculoEstado,
    default: VehiculoEstado.ACTIVO,
  })
  estado: VehiculoEstado;

  @BeforeInsert()
  @BeforeUpdate()
  normalizarDatos() {
    if (this.placa) {
      this.placa = this.placa.toUpperCase().trim();
    }
  }

  isActive(): boolean {
    return this.estado === VehiculoEstado.ACTIVO;
  }

  toBasicInfo() {
    return {
      id: this.id,
      placa: this.placa,
      estado: this.estado,
      tipoVehiculo: this.tipoVehiculo?.nombre,
    };
  }

  @OneToMany(() => Reserva, (reserva) => reserva.vehiculo)
  reservas: Reserva[];
}
