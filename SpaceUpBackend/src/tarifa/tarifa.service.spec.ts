import { Test, TestingModule } from '@nestjs/testing';
import { TarifaService } from './tarifa.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tarifa } from './tarifa.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockTarifaRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('TarifaService', () => {
  let service: TarifaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TarifaService,
        { provide: getRepositoryToken(Tarifa), useValue: mockTarifaRepository },
      ],
    }).compile();

    service = module.get<TarifaService>(TarifaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar todas las tarifas', async () => {
      mockTarifaRepository.find.mockResolvedValue([
        { id_tarifa: 1, monto: 10 },
        { id_tarifa: 2, monto: 20 },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('debe retornar tarifa por ID', async () => {
      mockTarifaRepository.findOne.mockResolvedValue({ id_tarifa: 1, monto: 10 });

      const result = await service.findOne(1);
      expect(result.id_tarifa).toBe(1);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockTarifaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear tarifa correctamente', async () => {
      mockTarifaRepository.findOne.mockResolvedValue(null);
      const newTarifa = { id_tarifa: 1, monto: 15 };
      mockTarifaRepository.create.mockReturnValue(newTarifa);
      mockTarifaRepository.save.mockResolvedValue(newTarifa);

      const result = await service.create({
        tipo_vehiculo: 'AUTO',
        tipo_tarifa: 'POR_HORA',
        monto: 15,
        id_estacionamiento: 1,
      });

      expect(result.monto).toBe(15);
    });

    it('debe lanzar ConflictException si la tarifa ya existe', async () => {
      mockTarifaRepository.findOne.mockResolvedValue({ id_tarifa: 1 });

      await expect(
        service.create({
          tipo_vehiculo: 'AUTO',
          tipo_tarifa: 'POR_HORA',
          monto: 15,
          id_estacionamiento: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('debe actualizar tarifa correctamente', async () => {
      // Sin campos de conflicto, va directo a update y findOne
      mockTarifaRepository.findOne.mockResolvedValue({ id_tarifa: 1, monto: 20 });
      mockTarifaRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, { monto: 20 });
      expect(result.monto).toBe(20);
    });

    it('debe lanzar ConflictException si la tarifa ya existe para otro ID', async () => {
      // findOne retorna tarifa con id distinto al que se actualiza
      mockTarifaRepository.findOne.mockResolvedValue({ id_tarifa: 2 });

      await expect(
        service.update(1, {
          tipo_vehiculo: 'AUTO' as any,
          tipo_tarifa: 'POR_HORA' as any,
          id_estacionamiento: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debe eliminar tarifa correctamente', async () => {
      mockTarifaRepository.delete.mockResolvedValue({ affected: 1 });
      await expect(service.remove(1)).resolves.not.toThrow();
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockTarifaRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
