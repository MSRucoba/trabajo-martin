import { Test, TestingModule } from '@nestjs/testing';
import { ServicioService } from './servicio.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Servicio } from './servicio.entity';
import { NotFoundException } from '@nestjs/common';

const mockServicioRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('ServicioService', () => {
  let service: ServicioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicioService,
        {
          provide: getRepositoryToken(Servicio),
          useValue: mockServicioRepository,
        },
      ],
    }).compile();

    service = module.get<ServicioService>(ServicioService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear un servicio correctamente', async () => {
      const newServicio = { id_servicio: 1, nombre: 'Lavado' };
      mockServicioRepository.create.mockReturnValue(newServicio);
      mockServicioRepository.save.mockResolvedValue(newServicio);

      const result = await service.create({ nombre: 'Lavado' });
      expect(result.nombre).toBe('Lavado');
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los servicios', async () => {
      mockServicioRepository.find.mockResolvedValue([
        { id_servicio: 1, nombre: 'Lavado' },
        { id_servicio: 2, nombre: 'Aire' },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });

    it('debe retornar lista vacía si no hay servicios', async () => {
      mockServicioRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('debe retornar servicio por ID', async () => {
      mockServicioRepository.findOne.mockResolvedValue({
        id_servicio: 1,
        nombre: 'Lavado',
      });

      const result = await service.findOne(1);
      expect(result.nombre).toBe('Lavado');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockServicioRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar servicio correctamente', async () => {
      const existing = { id_servicio: 1, nombre: 'Viejo' };
      mockServicioRepository.findOne.mockResolvedValue(existing);
      mockServicioRepository.save.mockResolvedValue({
        ...existing,
        nombre: 'Nuevo',
      });

      const result = await service.update(1, { nombre: 'Nuevo' });
      expect(result.nombre).toBe('Nuevo');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockServicioRepository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar servicio correctamente', async () => {
      const existing = { id_servicio: 1, nombre: 'Lavado' };
      mockServicioRepository.findOne.mockResolvedValue(existing);
      mockServicioRepository.remove.mockResolvedValue(existing);

      await expect(service.remove(1)).resolves.not.toThrow();
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockServicioRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
