import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estacionamiento } from './estacionamiento.entity';
import { CreateEstacionamientoDto } from './dto/create-estacionamiento.dto';
import { UpdateEstacionamientoDto } from './dto/update-estacionamiento.dto';
import { Empresa } from '../empresa/empresa.entity';
import { CupoVehiculo } from '../cupo-vehiculo/cupo-vehiculo.entity';
import { Tarifa } from '../tarifa/tarifa.entity';
import { EstacionamientoServicio } from '../estacionamiento-servicio/estacionamiento-servicio.entity';
import { ImagenEstacionamiento } from '../imagen-estacionamiento/imagen-estacionamiento.entity';
import { ImagenTipo } from '../imagen-estacionamiento/imagen-tipo.enum';
import { EmpleadoEmpresa } from '../empleado-empresa/empleado-empresa.entity';

@Injectable()
export class EstacionamientoService {
  constructor(
    @InjectRepository(Estacionamiento)
    private readonly estacionamientoRepository: Repository<Estacionamiento>,

    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,

    @InjectRepository(CupoVehiculo)
    private readonly cupoVehiculoRepository: Repository<CupoVehiculo>,

    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,

    @InjectRepository(EstacionamientoServicio)
    private readonly estacionamientoServicioRepository: Repository<EstacionamientoServicio>,

    @InjectRepository(ImagenEstacionamiento)
    private readonly imagenEstacionamientoRepository: Repository<ImagenEstacionamiento>,

    @InjectRepository(EmpleadoEmpresa)
    private readonly empleadoEmpresaRepository: Repository<EmpleadoEmpresa>,
  ) {}

  async create(dto: CreateEstacionamientoDto): Promise<Estacionamiento> {
    if (!dto.cupos_vehiculo || dto.cupos_vehiculo.length === 0) {
      throw new BadRequestException(
        'Debe especificar al menos un tipo de cupo',
      );
    }

    if (!dto.tarifas || dto.tarifas.length === 0) {
      throw new BadRequestException('Debe especificar al menos una tarifa');
    }
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: dto.id_empresa },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (dto.imagenes_galeria && dto.imagenes_galeria.length > 5) {
      throw new BadRequestException(
        'Solo se permiten máximo 5 imágenes en galería',
      );
    }

    const cuposTotales = dto.cupos_vehiculo.reduce(
      (sum, cupo) => sum + cupo.cupos_totales,
      0,
    );

    const estacionamiento = this.estacionamientoRepository.create({
      nombre: dto.nombre,
      direccion: dto.direccion,
      descripcion: dto.descripcion,
      latitud: dto.latitud,
      longitud: dto.longitud,
      cupos_totales: cuposTotales,
      cupos_disponibles: cuposTotales,
      hora_apertura: dto.hora_apertura,
      hora_cierre: dto.hora_cierre,
      es24h: dto.es24h ?? false,
      estado: dto.estado ?? true,
      telefono: dto.telefono,
      empresa: { id_empresa: dto.id_empresa } as any,
    });

    const savedEstacionamiento =
      await this.estacionamientoRepository.save(estacionamiento);

    for (const cupoDef of dto.cupos_vehiculo) {
      const cupoVehiculo = this.cupoVehiculoRepository.create({
        estacionamiento: savedEstacionamiento,
        tipo_vehiculo: cupoDef.tipo_vehiculo,
        cupos_totales: cupoDef.cupos_totales,
        cupos_disponibles: cupoDef.cupos_totales,
        activo: true,
      });
      await this.cupoVehiculoRepository.save(cupoVehiculo);
    }

    for (const tarifaDef of dto.tarifas) {
      const tarifa = this.tarifaRepository.create({
        tipo_vehiculo: tarifaDef.tipo_vehiculo,
        tipo_tarifa: tarifaDef.tipo_tarifa,
        monto: tarifaDef.monto,
        estacionamiento: savedEstacionamiento,
      });
      await this.tarifaRepository.save(tarifa);
    }

    if (dto.servicios && dto.servicios.length > 0) {
      for (const idServicio of dto.servicios) {
        const estServicio = this.estacionamientoServicioRepository.create({
          estacionamiento: savedEstacionamiento,
          servicio: { id_servicio: idServicio } as any,
          estado: true,
        });
        await this.estacionamientoServicioRepository.save(estServicio);
      }
    }

    if (dto.imagen_perfil) {
      const imagenPerfil = this.imagenEstacionamientoRepository.create({
        estacionamiento: savedEstacionamiento,
        url: dto.imagen_perfil,
        tipo: ImagenTipo.PERFIL,
      });
      await this.imagenEstacionamientoRepository.save(imagenPerfil);
    }

    if (dto.imagenes_galeria && dto.imagenes_galeria.length > 0) {
      for (const urlImagen of dto.imagenes_galeria) {
        const imagenGaleria = this.imagenEstacionamientoRepository.create({
          estacionamiento: savedEstacionamiento,
          url: urlImagen,
          tipo: ImagenTipo.GALERIA,
        });
        await this.imagenEstacionamientoRepository.save(imagenGaleria);
      }
    }

    return this.findOne(savedEstacionamiento.id_estacionamiento);
  }

  async findAll(): Promise<Estacionamiento[]> {
    return await this.estacionamientoRepository.find({
      relations: [
        'empresa',
        'empresa.usuario',
        'empresa.empleados',
        'empresa.empleados.usuario',
        'encargado',
        'tarifas',
        'servicios',
        'servicios.servicio',
        'imagenes',
        'cuposVehiculo',
      ],
    });
  }

  async findOne(id: number): Promise<Estacionamiento> {
    const estacionamiento = await this.estacionamientoRepository.findOne({
      where: { id_estacionamiento: id },
      relations: [
        'empresa',
        'empresa.usuario',
        'empresa.empleados',
        'empresa.empleados.usuario',
        'encargado',
        'tarifas',
        'servicios',
        'servicios.servicio',
        'imagenes',
        'cuposVehiculo',
      ],
    });
    if (!estacionamiento) {
      throw new NotFoundException(`Estacionamiento con id ${id} no encontrado`);
    }
    return estacionamiento;
  }

  async update(
    id: number,
    dto: UpdateEstacionamientoDto,
  ): Promise<Estacionamiento> {
    const estacionamiento = await this.findOne(id);

    const camposPermitidos = [
      'nombre',
      'direccion',
      'descripcion',
      'telefono',
      'latitud',
      'longitud',
      'hora_apertura',
      'hora_cierre',
      'es24h',
      'estado',
      'id_encargado',
    ];

    for (const campo of camposPermitidos) {
      if (dto[campo] !== undefined) {
        estacionamiento[campo] = dto[campo];
      }
    }

    await this.estacionamientoRepository.save(estacionamiento);

    if (dto.imagen_perfil !== undefined) {
      await this.imagenEstacionamientoRepository.delete({
        estacionamiento: { id_estacionamiento: id },
        tipo: ImagenTipo.PERFIL,
      });

      if (dto.imagen_perfil) {
        const imagenPerfil = this.imagenEstacionamientoRepository.create({
          estacionamiento: { id_estacionamiento: id } as any,
          url: dto.imagen_perfil,
          tipo: ImagenTipo.PERFIL,
        });
        await this.imagenEstacionamientoRepository.save(imagenPerfil);
      }
    }

    if (dto.imagenes_galeria !== undefined) {
      if (dto.imagenes_galeria.length > 5) {
        throw new BadRequestException(
          'Solo se permiten máximo 5 imágenes en galería',
        );
      }

      await this.imagenEstacionamientoRepository.delete({
        estacionamiento: { id_estacionamiento: id },
        tipo: ImagenTipo.GALERIA,
      });

      for (const urlImagen of dto.imagenes_galeria) {
        const imagenGaleria = this.imagenEstacionamientoRepository.create({
          estacionamiento: { id_estacionamiento: id } as any,
          url: urlImagen,
          tipo: ImagenTipo.GALERIA,
        });
        await this.imagenEstacionamientoRepository.save(imagenGaleria);
      }
    }

    if (dto.servicios !== undefined) {
      const serviciosActuales =
        await this.estacionamientoServicioRepository.find({
          where: { estacionamiento: { id_estacionamiento: id } },
          relations: ['servicio'],
        });
      const idsActuales = serviciosActuales.map((s) => s.servicio.id_servicio);
      const idsNuevos = dto.servicios;

      const serviciosAEliminar = serviciosActuales.filter(
        (s) => !idsNuevos.includes(s.servicio.id_servicio),
      );

      for (const servicio of serviciosAEliminar) {
        await this.estacionamientoServicioRepository.remove(servicio);
      }

      const idsAAgregar = idsNuevos.filter((id) => !idsActuales.includes(id));

      for (const idServicio of idsAAgregar) {
        const nuevoServicio = this.estacionamientoServicioRepository.create({
          estacionamiento: { id_estacionamiento: id } as any,
          servicio: { id_servicio: idServicio } as any,
          estado: true,
        });
        await this.estacionamientoServicioRepository.save(nuevoServicio);
      }
    }

    return this.findOne(id);
  }

  async recalcularCuposTotales(id: number): Promise<Estacionamiento> {
    const estacionamiento = await this.findOne(id);
    const cuposTotales = estacionamiento.cuposVehiculo.reduce(
      (sum, cupo) => sum + cupo.cupos_totales,
      0,
    );
    const cuposDisponibles = estacionamiento.cuposVehiculo.reduce(
      (sum, cupo) => sum + cupo.cupos_disponibles,
      0,
    );

    await this.estacionamientoRepository.update(id, {
      cupos_totales: cuposTotales,
      cupos_disponibles: cuposDisponibles,
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.estacionamientoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Estacionamiento con id ${id} no encontrado`);
    }
  }

  async toggleActivo(id: number, estado: boolean): Promise<Estacionamiento> {
    const estacionamiento = await this.findOne(id);
    estacionamiento.estado = estado;
    await this.estacionamientoRepository.save(estacionamiento);
    return estacionamiento;
  }

  async findActivos(): Promise<Estacionamiento[]> {
    return await this.estacionamientoRepository.find({
      where: { estado: true },
      relations: [
        'empresa',
        'empresa.usuario',
        'empresa.empleados',
        'empresa.empleados.usuario',
        'encargado',
        'tarifas',
        'servicios',
        'servicios.servicio',
        'imagenes',
        'cuposVehiculo',
      ],
    });
  }

  async findByEmpresa(empresaId: number): Promise<Estacionamiento[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa con id ${empresaId} no encontrada`);
    }

    return await this.estacionamientoRepository.find({
      where: { empresa: { id_empresa: empresaId } },
      relations: [
        'empresa',
        'empresa.usuario',
        'empresa.empleados',
        'empresa.empleados.usuario',
        'encargado',
        'tarifas',
        'servicios',
        'servicios.servicio',
        'imagenes',
        'cuposVehiculo',
      ],
      order: { id_estacionamiento: 'DESC' },
    });
  }

  async findByUsuario(usuarioId: number): Promise<Estacionamiento[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario'],
    });

    if (!empresa) {
      return [];
    }

    return await this.estacionamientoRepository.find({
      where: { empresa: { id_empresa: empresa.id_empresa } },
      relations: [
        'empresa',
        'empresa.usuario',
        'empresa.empleados',
        'empresa.empleados.usuario',
        'encargado',
        'tarifas',
        'servicios',
        'servicios.servicio',
        'imagenes',
        'cuposVehiculo',
      ],
      order: { id_estacionamiento: 'DESC' },
    });
  }

  async asignarEncargado(
    id_estacionamiento: number,
    id_encargado: number | null,
  ): Promise<Estacionamiento> {
    const estacionamiento = await this.findOne(id_estacionamiento);

    if (id_encargado) {
      const encargadoActivo = await this.empleadoEmpresaRepository.findOne({
        where: {
          empresa: { id_empresa: estacionamiento.empresa.id_empresa },
          usuario: { id: id_encargado },
          estado: 'ACTIVO',
        },
        relations: ['empresa', 'usuario'],
      });

      if (!encargadoActivo) {
        throw new BadRequestException(
          'El encargado no pertenece a esta empresa o no está activo',
        );
      }
    } else {
    }

    estacionamiento.id_encargado = id_encargado;
    await this.estacionamientoRepository.save(estacionamiento);

    const actualizado = await this.findOne(id_estacionamiento);

    return actualizado;
  }
  async findByEncargado(id_encargado: number): Promise<Estacionamiento> {
    const estacionamiento = await this.estacionamientoRepository.findOne({
      where: { id_encargado },
      relations: ['empresa', 'cuposVehiculo'],
    });

    if (!estacionamiento) {
      throw new NotFoundException('No tienes un estacionamiento asignado');
    }

    return estacionamiento;
  }
  async findByUsuarioEncargado(id_usuario: number): Promise<Estacionamiento> {
    const estacionamiento = await this.estacionamientoRepository.findOne({
      where: {
        encargado: { id: id_usuario },
      },
      relations: [
        'empresa',
        'cuposVehiculo',
        'encargado',
        'tarifas',
        'servicios',
        'servicios.servicio',
        'imagenes',
      ],
    });

    if (!estacionamiento) {
      throw new NotFoundException('No tienes un estacionamiento asignado');
    }

    return estacionamiento;
  }
}
