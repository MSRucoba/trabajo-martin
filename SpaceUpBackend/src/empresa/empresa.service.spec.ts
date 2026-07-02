import { Test, TestingModule } from '@nestjs/testing';
import { EmpresaService } from './empresa.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Empresa } from './empresa.entity';
import { SunatService } from './sunat.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockEmpresaRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockSunatService = {
  consultarRuc: jest.fn(),
};

describe('EmpresaService', () => {
  let service: EmpresaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        { provide: getRepositoryToken(Empresa), useValue: mockEmpresaRepository },
        { provide: SunatService, useValue: mockSunatService },
      ],
    }).compile();

    service = module.get<EmpresaService>(EmpresaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar todas las empresas', async () => {
      mockEmpresaRepository.find.mockResolvedValue([
        { id_empresa: 1, nombre_empresa: 'Empresa A' },
      ]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar empresa por ID', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue({
        id_empresa: 1,
        nombre_empresa: 'Empresa A',
      });
      const result = await service.findOne(1);
      expect(result.id_empresa).toBe(1);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear una empresa correctamente', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(null);
      mockSunatService.consultarRuc.mockResolvedValue({
        razon_social: 'Empresa SAC',
      });
      const newEmpresa = { id_empresa: 1, ruc: '20123456789' };
      mockEmpresaRepository.create.mockReturnValue(newEmpresa);
      mockEmpresaRepository.save.mockResolvedValue(newEmpresa);

      const result = await service.create({
        ruc: '20123456789',
        numero_contacto: '999999999',
        id_usuario: 1,
      });

      expect(result.ruc).toBe('20123456789');
    });

    it('debe lanzar ConflictException si el RUC ya existe', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue({ id_empresa: 1, ruc: '20123456789' });

      await expect(
        service.create({ ruc: '20123456789', numero_contacto: '999', id_usuario: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si el RUC no es válido en SUNAT', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(null);
      mockSunatService.consultarRuc.mockResolvedValue(null);

      await expect(
        service.create({ ruc: '20000000000', numero_contacto: '999', id_usuario: 1 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('debe actualizar empresa correctamente', async () => {
      // update sin ruc no hace la búsqueda de duplicado, va directo al update y findOne
      mockEmpresaRepository.findOne.mockResolvedValue({
        id_empresa: 1,
        nombre_empresa: 'Nueva',
      });
      mockEmpresaRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, { nombre_empresa: 'Nueva' });
      expect(result.id_empresa).toBe(1);
    });

    it('debe lanzar ConflictException si el RUC ya está en uso por otra empresa', async () => {
      // Simula que findOne encuentra empresa con id diferente (duplicado)
      mockEmpresaRepository.findOne.mockResolvedValue({
        id_empresa: 99,
        ruc: '20123456789',
      });

      await expect(
        service.update(1, { ruc: '20123456789' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debe eliminar empresa correctamente', async () => {
      mockEmpresaRepository.delete.mockResolvedValue({ affected: 1 });
      await expect(service.remove(1)).resolves.not.toThrow();
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockEmpresaRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verificarRuc', () => {
    it('debe retornar razón social del RUC', async () => {
      mockSunatService.consultarRuc.mockResolvedValue({
        data: { razon_social: 'Mi Empresa SAC' },
      });

      const result = await service.verificarRuc('20123456789');
      expect(result.razon_social).toBe('Mi Empresa SAC');
    });

    it('debe retornar null si no hay razón social', async () => {
      mockSunatService.consultarRuc.mockResolvedValue({});

      const result = await service.verificarRuc('20000000000');
      expect(result.razon_social).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('debe retornar empresa del usuario', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue({
        id_empresa: 1,
        usuario: { id: 5 },
      });

      const result = await service.findByUserId(5);
      expect(result.id_empresa).toBe(1);
    });

    it('debe lanzar NotFoundException si no hay empresa para el usuario', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(99)).rejects.toThrow(NotFoundException);
    });
  });
});
