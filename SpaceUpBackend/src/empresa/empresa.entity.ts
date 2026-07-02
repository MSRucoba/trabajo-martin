import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  Unique,
  OneToOne,
} from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { EmpleadoEmpresa } from '../empleado-empresa/empleado-empresa.entity';

@Entity('empresa')
@Unique(['ruc'])
export class Empresa {
  @PrimaryGeneratedColumn()
  id_empresa: number;

  @Column({ type: 'varchar', length: 100 })
  nombre_empresa: string;

  @Column({ type: 'varchar', length: 20 })
  ruc: string;

  @Column({ type: 'varchar', length: 20 })
  numero_contacto: string;

  @OneToOne(() => Usuario, (usuario) => usuario.empresa, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @OneToMany(() => Estacionamiento, (est) => est.empresa)
  estacionamientos: Estacionamiento[];

  @OneToMany(() => EmpleadoEmpresa, (emp) => emp.empresa)
  empleados: EmpleadoEmpresa[];
}
