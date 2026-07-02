import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Usuario } from '../usuario/usuario.entity';
import { TipoVehiculo } from '../tipo-vehiculo/tipo-vehiculo.entity';
import { Vehiculo } from './vehiculo.entity';
import { UserRole } from '../usuario/user-role.enum';
import { VehiculoEstado } from './enums/vehiculo-estados.enum';
import { EstadoReserva } from '../reserva/enums/estado-reserva.enum';

@Injectable()
export class VehiculoService {
  constructor(
    @InjectRepository(Vehiculo)
    private vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(TipoVehiculo)
    private tipoVehiculoRepo: Repository<TipoVehiculo>,
  ) {}

  async create(dto: CreateVehiculoDto): Promise<Vehiculo> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: dto.idUsuario },
      select: ['id', 'rol'],
    });
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${dto.idUsuario} no existe`);

    if (usuario.rol !== UserRole.CONDUCTOR) {
      throw new ConflictException(
        'Solo los conductores pueden registrar vehículos',
      );
    }

    const tipoVehiculo = await this.tipoVehiculoRepo.findOneBy({
      id: dto.idTipoVehiculo,
    });
    if (!tipoVehiculo)
      throw new NotFoundException(
        `Tipo de vehículo con ID ${dto.idTipoVehiculo} no existe`,
      );

    const placaExistente = await this.vehiculoRepo.findOne({
      where: { placa: dto.placa.toUpperCase() },
    });
    if (placaExistente)
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${dto.placa}`,
      );

    const vehiculo = this.vehiculoRepo.create({
      placa: dto.placa.toUpperCase(),
      apodo: dto.apodo?.trim(),
      estado: dto.estado || VehiculoEstado.ACTIVO,
      usuario,
      tipoVehiculo,
    });

    return this.vehiculoRepo.save(vehiculo);
  }

  findAll(): Promise<Vehiculo[]> {
    return this.vehiculoRepo.find({ relations: ['usuario', 'tipoVehiculo'] });
  }

  async findOne(id: number): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id },
      relations: ['tipoVehiculo'],
    });
    if (!vehiculo)
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    return vehiculo;
  }

  async findByUser(idUsuario: number): Promise<Vehiculo[]> {
    const usuario = await this.usuarioRepo.findOneBy({ id: idUsuario });
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${idUsuario} no existe`);

    return this.vehiculoRepo.find({
      where: { usuario: { id: idUsuario } },
      relations: ['usuario', 'tipoVehiculo'],
    });
  }

  async findActiveByUser(idUsuario: number): Promise<Vehiculo[]> {
    return this.vehiculoRepo.find({
      where: { usuario: { id: idUsuario }, estado: VehiculoEstado.ACTIVO },
      relations: ['tipoVehiculo'],
    });
  }

  async update(id: number, dto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);

    if (dto.placa && dto.placa.toUpperCase() !== vehiculo.placa) {
      const placaExistente = await this.vehiculoRepo.findOne({
        where: { placa: dto.placa.toUpperCase() },
      });
      if (placaExistente)
        throw new ConflictException(
          `Ya existe un vehículo con la placa ${dto.placa}`,
        );
    }

    if (dto.placa) vehiculo.placa = dto.placa.toUpperCase();
    if (dto.estado) vehiculo.estado = dto.estado;
    if (dto.apodo !== undefined) vehiculo.apodo = dto.apodo.trim();
    if (dto.idTipoVehiculo && dto.idTipoVehiculo !== vehiculo.tipoVehiculo.id) {
      const tipoVehiculo = await this.tipoVehiculoRepo.findOneBy({
        id: dto.idTipoVehiculo,
      });
      if (!tipoVehiculo)
        throw new NotFoundException(
          `Tipo de vehículo con ID ${dto.idTipoVehiculo} no existe`,
        );
      vehiculo.tipoVehiculo = tipoVehiculo;
    }

    return this.vehiculoRepo.save(vehiculo);
  }

  async deactivate(id: number): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    vehiculo.estado = VehiculoEstado.INACTIVO;
    return this.vehiculoRepo.save(vehiculo);
  }

  async remove(id: number): Promise<void> {
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id },
      relations: ['reservas'],
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    const reservasActivas = vehiculo.reservas?.some(
      (reserva) =>
        reserva.estado === EstadoReserva.PENDIENTE ||
        reserva.estado === EstadoReserva.CONSUMO,
    );

    if (reservasActivas) {
      throw new ConflictException(
        `No se puede eliminar el vehículo con ID ${id} porque tiene reservas activas`,
      );
    }

    await this.vehiculoRepo.delete(id);
  }

  async canMakeReservation(id: number): Promise<boolean> {
    const vehiculo = await this.findOne(id);
    return vehiculo.estado === VehiculoEstado.ACTIVO;
  }

  async getVehicleStats(
    idUsuario: number,
  ): Promise<{ total: number; activos: number; inactivos: number }> {
    const vehiculos = await this.vehiculoRepo.find({
      where: { usuario: { id: idUsuario } },
      select: ['estado'],
    });
    return {
      total: vehiculos.length,
      activos: vehiculos.filter((v) => v.estado === VehiculoEstado.ACTIVO)
        .length,
      inactivos: vehiculos.filter((v) => v.estado === VehiculoEstado.INACTIVO)
        .length,
    };
  }
}
