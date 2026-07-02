import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../usuario/usuario.entity';
import { Empresa } from '../empresa/empresa.entity';
import { ReniecService } from '../usuario/reniec.service';
import { SunatService } from '../empresa/sunat.service';
import { UserRole } from '../usuario/user-role.enum';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockEmpresaRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('test-token'),
};

const mockReniecService = {
  consultarDni: jest.fn(),
};

const mockSunatService = {
  consultarRuc: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: mockUserRepo },
        { provide: getRepositoryToken(Empresa), useValue: mockEmpresaRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ReniecService, useValue: mockReniecService },
        { provide: SunatService, useValue: mockSunatService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debe retornar token cuando las credenciales son válidas', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        rol: UserRole.CONDUCTOR,
        empresa: null,
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        rol: UserRole.CONDUCTOR,
        empresa: null,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('debe registrar conductor con DNI válido', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockReniecService.consultarDni.mockResolvedValue({
        nombre: 'Juan',
        apellido: 'Perez',
        dni: '12345678',
      });
      const savedUser = {
        id: 1,
        email: 'juan@test.com',
        password: 'hashed',
        rol: UserRole.CONDUCTOR,
      };
      mockUserRepo.create.mockReturnValue(savedUser);
      mockUserRepo.save.mockResolvedValue(savedUser);

      const result = await service.register({
        email: 'juan@test.com',
        password: 'pass123',
        dni: '12345678',
        phone: '999999999',
      });

      expect(result).toHaveProperty('token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'existente@test.com',
        dni: '99999999',
      });

      await expect(
        service.register({
          email: 'existente@test.com',
          password: 'pass',
          dni: '12345678',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si no hay DNI ni RUC', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.register({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar anfitrión con RUC válido', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockSunatService.consultarRuc.mockResolvedValue({
        data: { razon_social: 'Empresa SAC' },
      });
      const savedUser = {
        id: 2,
        email: 'empresa@test.com',
        password: 'hashed',
        rol: UserRole.ANFITRION,
      };
      mockUserRepo.create.mockReturnValue(savedUser);
      mockUserRepo.save.mockResolvedValue(savedUser);
      mockEmpresaRepo.create.mockReturnValue({ ruc: '20123456789' });
      mockEmpresaRepo.save.mockResolvedValue({ ruc: '20123456789' });

      const result = await service.register({
        email: 'empresa@test.com',
        password: 'pass123',
        ruc: '20123456789',
        numero_contacto: '999999999',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('empresa');
    });

    it('debe lanzar BadRequestException si RUC no es válido en SUNAT', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockSunatService.consultarRuc.mockResolvedValue({ data: {} });

      await expect(
        service.register({
          email: 'empresa@test.com',
          password: 'pass',
          ruc: '20000000000',
          numero_contacto: '999999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fixPassword', () => {
    it('debe actualizar la contraseña correctamente', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'oldHash',
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser, password: 'newHash' });

      const result = await service.fixPassword('test@test.com', 'newPassword');

      expect(result).toHaveProperty('message', 'Contraseña actualizada correctamente');
      expect(result).toHaveProperty('email', 'test@test.com');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.fixPassword('noexiste@test.com', 'newPass'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyPassword', () => {
    it('debe verificar contraseña correctamente', async () => {
      const hashed = await bcrypt.hash('miPassword', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        password: hashed,
      });

      const result = await service.verifyPassword(1, 'miPassword');
      expect(result.success).toBe(true);
    });

    it('debe lanzar NotFoundException si usuario no existe', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyPassword(99, 'pass')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar UnauthorizedException si la contraseña no coincide', async () => {
      const hashed = await bcrypt.hash('correctPass', 10);
      mockUserRepo.findOne.mockResolvedValue({ id: 1, password: hashed });

      await expect(service.verifyPassword(1, 'wrongPass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
