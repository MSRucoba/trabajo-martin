import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { EmpleadoEmpresa } from '../empleado-empresa/empleado-empresa.entity';
import { UserRole } from '../usuario/user-role.enum';

interface UsuarioCard {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  phone: string;
  rol: string;
  imagenPerfil: string;
  nombreEmpresa: string | null;
  fechaRegistro: Date;
}

@Injectable()
export class UsuariosWebService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(EmpleadoEmpresa)
    private empleadoEmpresaRepo: Repository<EmpleadoEmpresa>,
  ) {}

  async getAllWithDetails(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    usuarios: UsuarioCard[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [usuarios, total] = await this.usuarioRepo.findAndCount({
      relations: ['empresa'],
      skip,
      take: limit,
      order: { fechaRegistro: 'DESC' },
    });

    const usuariosCard: UsuarioCard[] = await Promise.all(
      usuarios.map(async (usuario) => {
        let nombreEmpresa: string | null = null;

        if (usuario.rol === UserRole.ANFITRION && usuario.empresa) {
          nombreEmpresa = usuario.empresa.nombre_empresa;
        } else if (
          usuario.rol === UserRole.ENCARGADO ||
          usuario.rol === UserRole.ANFITRION
        ) {
          const empleado = await this.empleadoEmpresaRepo.findOne({
            where: { usuario: { id: usuario.id } },
            relations: ['empresa'],
          });
          if (empleado && empleado.empresa) {
            nombreEmpresa = empleado.empresa.nombre_empresa;
          }
        }

        return {
          id: usuario.id,
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          dni: usuario.dni || '',
          email: usuario.email,
          phone: usuario.phone || '',
          rol: usuario.rol,
          imagenPerfil: usuario.imagenPerfil || '',
          nombreEmpresa,
          fechaRegistro: usuario.fechaRegistro,
        };
      }),
    );

    return {
      usuarios: usuariosCard,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
