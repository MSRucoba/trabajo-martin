import { Test, TestingModule } from '@nestjs/testing';
import { VehiculoService } from './vehiculo.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehiculo } from './vehiculo.entity';
import { Usuario } from '../usuario/usuario.entity';
import { TipoVehiculo } from '../tipo-vehiculo/tipo-vehiculo.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '../usuario/user-role.enum';
import { VehiculoEstado } from './enums/vehiculo-estados.enum';
import { EstadoReserva } from '../reserva/enums/estado-reserva.enum';

const mockVehiculoRepo = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockUsuarioRepo = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
};

const mockTipoVehiculoRepo = {
  findOneBy: jest.fn(),
};

describe('VehiculoService', () => {
  let service: VehiculoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculoService,
        { provide: getRepositoryToken(Vehiculo), useValue: mockVehiculoRepo },
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
        {
          provide: getRepositoryToken(TipoVehiculo),
          useValue: mockTipoVehiculoRepo,
        },
      ],
    }).compile();

    service = module.get<VehiculoService>(VehiculoService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear un vehículo correctamente', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({
        id: 1,
        rol: UserRole.CONDUCTOR,
      });
      mockTipoVehiculoRepo.findOneBy.mockResolvedValue({ id: 1, nombre: 'Auto' });
      mockVehiculoRepo.findOne.mockResolvedValue(null);
      const newVehiculo = {
        id: 1,
        placa: 'ABC123',
        estado: VehiculoEstado.ACTIVO,
      };
      mockVehiculoRepo.create.mockReturnValue(newVehiculo);
      mockVehiculoRepo.save.mockResolvedValue(newVehiculo);

      const result = await service.create({
        idUsuario: 1,
        idTipoVehiculo: 1,
        placa: 'abc123',
      });

      expect(result.placa).toBe('ABC123');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ idUsuario: 99, idTipoVehiculo: 1, placa: 'XYZ999' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el usuario no es CONDUCTOR', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({
        id: 1,
        rol: UserRole.ADMIN,
      });

      await expect(
        service.create({ idUsuario: 1, idTipoVehiculo: 1, placa: 'XYZ999' }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar NotFoundException si el tipo de vehículo no existe', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({
        id: 1,
        rol: UserRole.CONDUCTOR,
      });
      mockTipoVehiculoRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ idUsuario: 1, idTipoVehiculo: 99, placa: 'XYZ999' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si la placa ya existe', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({
        id: 1,
        rol: UserRole.CONDUCTOR,
      });
      mockTipoVehiculoRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockVehiculoRepo.findOne.mockResolvedValue({ id: 2, placa: 'ABC123' });

      await expect(
        service.create({ idUsuario: 1, idTipoVehiculo: 1, placa: 'ABC123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los vehículos', async () => {
      mockVehiculoRepo.find.mockResolvedValue([
        { id: 1, placa: 'ABC123' },
        { id: 2, placa: 'XYZ456' },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('debe retornar un vehículo por ID', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue({ id: 1, placa: 'ABC123' });

      const result = await service.findOne(1);
      expect(result.placa).toBe('ABC123');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('debe retornar vehículos del usuario', async () => {
      mockUsuarioRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockVehiculoRepo.find.mockResolvedValue([{ id: 1, placa: 'ABC123' }]);

      const result = await service.findByUser(1);
      expect(result).toHaveLength(1);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUsuarioRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findByUser(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('debe desactivar un vehículo', async () => {
      const vehiculo = { id: 1, placa: 'ABC123', estado: VehiculoEstado.ACTIVO };
      mockVehiculoRepo.findOne.mockResolvedValue(vehiculo);
      mockVehiculoRepo.save.mockResolvedValue({
        ...vehiculo,
        estado: VehiculoEstado.INACTIVO,
      });

      const result = await service.deactivate(1);
      expect(result.estado).toBe(VehiculoEstado.INACTIVO);
    });
  });

  describe('remove', () => {
    it('debe eliminar un vehículo sin reservas activas', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue({
        id: 1,
        reservas: [{ estado: EstadoReserva.FINALIZADO }],
      });
      mockVehiculoRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(1)).resolves.not.toThrow();
    });

    it('debe lanzar NotFoundException si el vehículo no existe', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si tiene reservas activas', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue({
        id: 1,
        reservas: [{ estado: EstadoReserva.PENDIENTE }],
      });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('canMakeReservation', () => {
    it('debe retornar true si el vehículo está activo', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue({
        id: 1,
        estado: VehiculoEstado.ACTIVO,
      });

      const result = await service.canMakeReservation(1);
      expect(result).toBe(true);
    });

    it('debe retornar false si el vehículo está inactivo', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue({
        id: 1,
        estado: VehiculoEstado.INACTIVO,
      });

      const result = await service.canMakeReservation(1);
      expect(result).toBe(false);
    });
  });

  describe('getVehicleStats', () => {
    it('debe retornar estadísticas de vehículos del usuario', async () => {
      mockVehiculoRepo.find.mockResolvedValue([
        { estado: VehiculoEstado.ACTIVO },
        { estado: VehiculoEstado.ACTIVO },
        { estado: VehiculoEstado.INACTIVO },
      ]);

      const result = await service.getVehicleStats(1);
      expect(result.total).toBe(3);
      expect(result.activos).toBe(2);
      expect(result.inactivos).toBe(1);
    });
  });
});
