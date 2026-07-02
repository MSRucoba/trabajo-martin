import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './usuario.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { ReniecService } from './reniec.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock cloud_storage to avoid uuid ESM issues
jest.mock('src/util/cloud_storage', () => ({
  storage: jest.fn().mockResolvedValue('http://mock-url/image.jpg'),
}));

const mockUsersRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockReniecService = {
  consultarDni: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsersRepository,
        },
        { provide: ReniecService, useValue: mockReniecService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar lista de usuarios', async () => {
      const usuarios = [{ id: 1, email: 'a@a.com' }, { id: 2, email: 'b@b.com' }];
      mockUsersRepository.find.mockResolvedValue(usuarios);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockUsersRepository.find).toHaveBeenCalled();
    });

    it('debe retornar lista vacía si no hay usuarios', async () => {
      mockUsersRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario por ID', async () => {
      const mockUser = { id: 1, email: 'test@test.com', empresa: null };
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('debe lanzar NotFoundException si no existe el usuario', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear un usuario correctamente', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockReniecService.consultarDni.mockResolvedValue({
        nombre: 'Juan',
        apellido: 'Perez',
        dni: '12345678',
      });
      const newUser = { id: 1, email: 'juan@test.com', dni: '12345678' };
      mockUsersRepository.create.mockReturnValue(newUser);
      mockUsersRepository.save.mockResolvedValue(newUser);

      const result = await service.create({
        email: 'juan@test.com',
        dni: '12345678',
        password: 'pass123',
        phone: '999999999',
      });

      expect(result.email).toBe('juan@test.com');
    });

    it('debe lanzar ConflictException si el DNI ya existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        dni: '12345678',
        email: 'otro@test.com',
      });

      await expect(
        service.create({
          email: 'nuevo@test.com',
          dni: '12345678',
          password: 'pass',
          phone: '999',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si el DNI no es válido en RENIEC', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockReniecService.consultarDni.mockResolvedValue(null);

      await expect(
        service.create({
          email: 'test@test.com',
          dni: '00000000',
          password: 'pass',
          phone: '999',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verificarDni', () => {
    it('debe retornar info del DNI', async () => {
      mockReniecService.consultarDni.mockResolvedValue({
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
      });

      const result = await service.verificarDni('12345678');
      expect(result.nombre).toBe('Juan');
    });

    it('debe lanzar ConflictException si el DNI no se encuentra', async () => {
      mockReniecService.consultarDni.mockResolvedValue(null);

      await expect(service.verificarDni('00000000')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateProfile', () => {
    it('debe actualizar el perfil correctamente', async () => {
      const mockUser = { id: 1, email: 'old@test.com', phone: '111' };
      mockUsersRepository.findOneBy.mockResolvedValue(mockUser);
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.save.mockResolvedValue({
        ...mockUser,
        email: 'new@test.com',
      });

      const result = await service.updateProfile(1, { email: 'new@test.com' });
      expect(result.email).toBe('new@test.com');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { email: 'x@x.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el email ya está en uso', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'old@test.com',
      });
      mockUsersRepository.findOne.mockResolvedValue({
        id: 2,
        email: 'taken@test.com',
      });

      await expect(
        service.updateProfile(1, { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePassword', () => {
    it('debe actualizar la contraseña correctamente', async () => {
      const hashed = await bcrypt.hash('oldPass', 10);
      const mockUser = { id: 1, password: hashed };
      mockUsersRepository.findOneBy.mockResolvedValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(mockUser);

      const result = await service.updatePassword(1, {
        currentPassword: 'oldPass',
        newPassword: 'newPass123',
      });

      expect(result.message).toBe('Contraseña actualizada correctamente');
    });

    it('debe lanzar NotFoundException si usuario no existe', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updatePassword(999, {
          currentPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar UnauthorizedException si la contraseña actual es incorrecta', async () => {
      const hashed = await bcrypt.hash('correctPass', 10);
      mockUsersRepository.findOneBy.mockResolvedValue({
        id: 1,
        password: hashed,
      });

      await expect(
        service.updatePassword(1, {
          currentPassword: 'wrongPass',
          newPassword: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
