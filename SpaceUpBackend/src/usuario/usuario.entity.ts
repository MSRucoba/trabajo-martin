import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user-role.enum';
import { Vehiculo } from '../vehiculo/vehiculo.entity';
import { Empresa } from '../empresa/empresa.entity';
import { Reserva } from '../reserva/reserva.entity';
import { EmpleadoEmpresa } from '../empleado-empresa/empleado-empresa.entity';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id: number;

  @Column({ length: 100, nullable: true })
  nombre?: string;

  @Column({ length: 100, nullable: true })
  apellido?: string;

  @Column({ length: 15, unique: true, nullable: true })
  dni?: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 15, nullable: true })
  phone?: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CONDUCTOR,
  })
  rol: UserRole;

  @Column({ name: 'imagen_perfil', type: 'text', nullable: true })
  imagenPerfil?: string;

  @Column({
    name: 'stripe_customer_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  stripeCustomerId?: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.usuario)
  vehiculos: Vehiculo[];

  @OneToOne(() => Empresa, (empresa) => empresa.usuario)
  empresa: Empresa;

  @OneToMany(() => Reserva, (reserva) => reserva.usuario)
  reservas: Reserva[];

  @OneToMany(() => EmpleadoEmpresa, (emp) => emp.usuario)
  relacionesLaborales: EmpleadoEmpresa[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    } else {
      this.password = this.password;
    }
  }
}
