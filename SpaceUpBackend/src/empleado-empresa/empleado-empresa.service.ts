import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmpleadoEmpresa } from './empleado-empresa.entity';
import { CreateEmpleadoEmpresaDto } from './dto/create-empleado-empresa.dto';
import { UpdateEmpleadoEmpresaDto } from './dto/update-empleado-empresa.dto';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UserRole } from '../usuario/user-role.enum';
import { CreateEncargadoDto } from './dto/create-encargado.dto';
import { EstacionamientoService } from 'src/estacionamiento/estacionamiento.service';
import { Estacionamiento } from 'src/estacionamiento/estacionamiento.entity';

@Injectable()
export class EmpleadoEmpresaService {
  constructor(
    @InjectRepository(EmpleadoEmpresa)
    private readonly empleadoEmpresaRepository: Repository<EmpleadoEmpresa>,

    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(Estacionamiento)
    private readonly estacionamientoRepository: Repository<Estacionamiento>,

    private readonly estacionamientoService: EstacionamientoService,
  ) {}

  async create(dto: CreateEmpleadoEmpresaDto): Promise<EmpleadoEmpresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: dto.id_empresa },
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    const usuario = await this.usuarioRepository.findOne({
      where: { id: dto.id_usuario },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (usuario.rol !== UserRole.ENCARGADO)
      throw new BadRequestException('El usuario no tiene rol de ENCARGADO');

    const existente = await this.empleadoEmpresaRepository.findOne({
      where: {
        empresa: { id_empresa: dto.id_empresa },
        usuario: { id: dto.id_usuario },
      },
    });
    if (existente)
      throw new BadRequestException(
        'El usuario ya está vinculado a esta empresa',
      );

    const relacion = this.empleadoEmpresaRepository.create({
      empresa,
      usuario,
      estado: dto.estado ?? 'ACTIVO',
    });
    return await this.empleadoEmpresaRepository.save(relacion);
  }

  async createWithAccount(
    dto: CreateEncargadoDto,
    id_usuario_anfitrion: number,
  ) {
    const empresa = await this.empresaRepository.findOne({
      where: { usuario: { id: id_usuario_anfitrion } },
    });

    if (!empresa)
      throw new NotFoundException(
        'No se encontró una empresa asociada al anfitrión logueado',
      );

    const estacionamiento = await this.estacionamientoService.findOne(
      dto.id_estacionamiento,
    );

    if (estacionamiento.empresa.id_empresa !== empresa.id_empresa) {
      throw new NotFoundException(
        'El estacionamiento no pertenece a tu empresa',
      );
    }

    if (estacionamiento.id_encargado) {
      throw new BadRequestException(
        'Este estacionamiento ya tiene un encargado asignado',
      );
    }

    const existingUser = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser)
      throw new ConflictException('El correo ya está registrado');

    const nuevoUsuario = this.usuarioRepository.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      phone: dto.phone,
      password: dto.password, // ✅ Password en texto plano, el hook lo hasheará
      rol: UserRole.ENCARGADO,
    });

    const savedUsuario = await this.usuarioRepository.save(nuevoUsuario);

    const relacion = this.empleadoEmpresaRepository.create({
      empresa,
      usuario: savedUsuario,
      estado: 'ACTIVO',
    });

    await this.empleadoEmpresaRepository.save(relacion);

    await this.estacionamientoService.asignarEncargado(
      dto.id_estacionamiento,
      savedUsuario.id,
    );

    return {
      message: 'Encargado creado correctamente y asignado al estacionamiento',
      usuario: savedUsuario,
      relacion,
      estacionamiento: {
        id: estacionamiento.id_estacionamiento,
        nombre: estacionamiento.nombre,
      },
    };
  }

  async findByEmpresa(id_empresa: number): Promise<EmpleadoEmpresa[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa },
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    return await this.empleadoEmpresaRepository.find({
      where: { empresa: { id_empresa } },
      relations: ['usuario', 'empresa'],
      select: {
        id_empleado_empresa: true,
        estado: true,
        empresa: {
          id_empresa: true,
        },
        usuario: true,
      },
    });
  }

  async updateEstado(
    id: number,
    dto: UpdateEmpleadoEmpresaDto,
  ): Promise<EmpleadoEmpresa> {
    const relacion = await this.empleadoEmpresaRepository.findOne({
      where: { id_empleado_empresa: id },
    });
    if (!relacion) throw new NotFoundException('Registro no encontrado');

    relacion.estado = dto.estado ?? relacion.estado;
    return await this.empleadoEmpresaRepository.save(relacion);
  }

  async remove(id: number): Promise<void> {
    console.log(
      `[EmpleadoEmpresaService] Iniciando eliminación de empleado ID: ${id}`,
    );

    const empleado = await this.empleadoEmpresaRepository.findOne({
      where: { id_empleado_empresa: id },
      relations: ['usuario', 'empresa'],
    });

    if (!empleado) {
      throw new NotFoundException('Registro no encontrado');
    }

    const idUsuario = empleado.usuario.id;
    console.log(`[EmpleadoEmpresaService] Usuario asociado ID: ${idUsuario}`);

    const estacionamientos = await this.estacionamientoRepository.find({
      where: { id_encargado: idUsuario },
    });

    console.log(
      `[EmpleadoEmpresaService] Estacionamientos encontrados: ${estacionamientos.length}`,
    );

    if (estacionamientos.length > 0) {
      await this.estacionamientoRepository.update(
        { id_encargado: idUsuario },
        { id_encargado: null },
      );
      console.log(
        `❱❱❱ [EmpleadoEmpresaService] Estacionamientos actualizados (id_encargado = NULL)`,
      );
    }

    await this.empleadoEmpresaRepository.delete(id);
    console.log(`[EmpleadoEmpresaService] Relación empleado-empresa eliminada`);

    await this.usuarioRepository.delete(idUsuario);
    console.log(`[EmpleadoEmpresaService] Usuario eliminado ID: ${idUsuario}`);

    console.log(`[EmpleadoEmpresaService] Eliminación completa exitosa`);
  }

  async findByEstacionamiento(
    id_estacionamiento: number,
  ): Promise<EmpleadoEmpresa | null> {
    const estacionamiento =
      await this.estacionamientoService.findOne(id_estacionamiento);

    if (!estacionamiento.id_encargado) {
      return null;
    }

    const empleadoEmpresa = await this.empleadoEmpresaRepository.findOne({
      where: {
        empresa: { id_empresa: estacionamiento.empresa.id_empresa },
        usuario: { id: estacionamiento.id_encargado },
      },
      relations: ['usuario', 'empresa'],
    });

    return empleadoEmpresa || null;
  }
}
