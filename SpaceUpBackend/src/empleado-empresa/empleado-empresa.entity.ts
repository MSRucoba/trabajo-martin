import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';

@Entity('empleado_empresa')
export class EmpleadoEmpresa {
  @PrimaryGeneratedColumn()
  id_empleado_empresa: number;

  @ManyToOne(() => Empresa, (empresa) => empresa.empleados, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @ManyToOne(() => Usuario, (usuario) => usuario.relacionesLaborales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: string;
}
