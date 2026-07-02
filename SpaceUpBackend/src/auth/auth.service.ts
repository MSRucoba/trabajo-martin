import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Usuario } from '../usuario/usuario.entity';
import { Empresa } from '../empresa/empresa.entity';
import { UserRole } from '../usuario/user-role.enum';
import { ReniecService } from '../usuario/reniec.service';
import { SunatService } from '../empresa/sunat.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepo: Repository<Usuario>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    private readonly jwtService: JwtService,
    private readonly reniecService: ReniecService,
    private readonly sunatService: SunatService,
  ) {}

  async register(dto: RegisterAuthDto) {
    console.log('═══════════════════════════════════════');
    console.log('❱❱❱ [REGISTER] Email recibido:', dto.email);
    console.log('═══════════════════════════════════════');

    const existingUser = await this.userRepo.findOne({
      where: [{ email: dto.email }, { dni: dto.dni }],
    });

    if (existingUser) {
      if (existingUser.email === dto.email)
        throw new ConflictException('El correo ya está registrado');
      if (existingUser.dni && existingUser.dni === dto.dni)
        throw new ConflictException('El DNI ya está registrado');
    }

    if (dto.ruc) {
      const datos: any = await this.sunatService.consultarRuc(dto.ruc);
      const razonSocial =
        datos?.data?.razon_social || datos?.razon_social || null;

      if (!razonSocial)
        throw new BadRequestException(
          'El RUC no es válido o no existe en SUNAT',
        );
      if (!dto.numero_contacto)
        throw new BadRequestException('El número de contacto es obligatorio');

      const anfitrion = this.userRepo.create({
        email: dto.email,
        phone: dto.numero_contacto,
        password: String(dto.password || '').trim(),
        rol: UserRole.ANFITRION,
      });

      const savedUser = await this.userRepo.save(anfitrion);

      const empresa = this.empresaRepo.create({
        ruc: dto.ruc,
        nombre_empresa: razonSocial,
        numero_contacto: dto.numero_contacto,
        usuario: savedUser,
      });

      await this.empresaRepo.save(empresa);

      const token = this.jwtService.sign({
        id: savedUser.id,
        email: savedUser.email,
        rol: savedUser.rol,
      });

      const { password, ...userData } = savedUser;
      return {
        message: 'Anfitrión registrado correctamente',
        user: userData,
        empresa,
        token: 'Bearer ' + token,
      };
    }

    if (dto.dni) {
      const info = await this.reniecService.consultarDni(dto.dni);
      const plainPassword = String(dto.password || '').trim();

      console.log(
        '❱❱❱ [REGISTER] Password plano a hashear en entity:',
        plainPassword,
      );

      const user = this.userRepo.create({
        dni: dto.dni,
        nombre: info?.nombre?.trim() || 'TEST',
        apellido: info?.apellido?.trim() || 'USER',
        email: dto.email,
        phone: dto.phone,
        password: plainPassword,
        rol: UserRole.CONDUCTOR,
      });

      const saved = await this.userRepo.save(user);
      console.log('❱❱❱ [REGISTER] Usuario guardado:', saved.email);
      console.log('═══════════════════════════════════════');

      const token = this.jwtService.sign({
        id: saved.id,
        email: saved.email,
        rol: saved.rol,
      });

      const { password, ...userData } = saved;
      return {
        message: 'Conductor registrado correctamente',
        user: userData,
        token: 'Bearer ' + token,
      };
    }

    throw new BadRequestException('Debe ingresar un DNI o RUC válido');
  }

  async login(dto: LoginAuthDto) {
    console.log('═══════════════════════════════════════');
    console.log('❱❱❱ [LOGIN] Email recibido:', dto.email);

    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['empresa'],
    });
    if (!user) {
      console.log('❱❱❱ [LOGIN] Usuario NO encontrado');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    console.log('❱❱❱ [LOGIN] Usuario encontrado:', user.email);

    const isPasswordValid = await bcrypt.compare(
      String(dto.password || ''),
      user.password,
    );
    console.log('❱❱❱ [LOGIN] ¿Password válido?:', isPasswordValid);
    console.log('═══════════════════════════════════════');

    if (!isPasswordValid)
      throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    const { password, ...userData } = user;
    return { user: userData, empresa: user.empresa, token: 'Bearer ' + token };
  }

  async fixPassword(email: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const hashedPassword = await bcrypt.hash(
      String(newPassword || '').trim(),
      10,
    );
    user.password = hashedPassword;
    await this.userRepo.save(user);

    return {
      message: 'Contraseña actualizada correctamente',
      email: user.email,
      newHash: hashedPassword,
    };
  }

  async verifyPassword(id_usuario: number, password: string) {
    const user = await this.userRepo.findOne({ where: { id: id_usuario } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña incorrecta');

    return { message: 'Verificación exitosa', success: true };
  }
}
