import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ReniecService } from './reniec.service';
import { storage } from 'src/util/cloud_storage';
import { UpdateUserDto } from './dto/update-user.dtp';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usersRepository: Repository<Usuario>,
    private readonly reniecService: ReniecService,
  ) {}

  async create(userDto: CreateUserDto): Promise<Usuario> {
    await this.validarDuplicados(userDto.dni, userDto.email);
    const info = await this.reniecService.consultarDni(userDto.dni);
    if (!info || !info.nombre) {
      throw new ConflictException('El DNI no es válido o no existe en RENIEC');
    }
    const newUser = this.usersRepository.create({
      ...userDto,
      nombre: info.nombre.trim(),
      apellido: info.apellido.trim(),
    });
    return await this.usersRepository.save(newUser);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<Usuario> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['empresa'],
    });
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  async verificarDni(dni: string) {
    const info = await this.reniecService.consultarDni(dni);
    if (!info)
      throw new ConflictException('No se encontró información para el DNI');
    return { dni: info.dni, nombre: info.nombre, apellido: info.apellido };
  }

  private async validarDuplicados(dni: string, email: string): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ dni }, { email }],
    });
    if (existingUser) {
      if (existingUser.dni === dni)
        throw new ConflictException('El DNI ya está registrado');
      if (existingUser.email === email)
        throw new ConflictException('El correo electrónico ya está registrado');
    }
  }

  async updateImage(
    id: number,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    if (!file) throw new ConflictException('Debe enviar una imagen válida');
    const url = await storage(file, `usuarios/${id}/perfil_${Date.now()}`);
    user.imagenPerfil = url;
    await this.usersRepository.save(user);
    return { url };
  }

  async updateProfile(id: number, updateDto: UpdateUserDto): Promise<Usuario> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateDto.email },
      });
      if (existingUser)
        throw new ConflictException('Este correo ya está en uso');
    }
    if (updateDto.phone && updateDto.phone !== user.phone) {
      const existingUser = await this.usersRepository.findOne({
        where: { phone: updateDto.phone },
      });
      if (existingUser)
        throw new ConflictException('Este teléfono ya está registrado');
    }
    if (updateDto.email) user.email = updateDto.email;
    if (updateDto.phone) user.phone = updateDto.phone;
    return await this.usersRepository.save(user);
  }

  async updatePassword(
    id: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!passwordMatch)
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
