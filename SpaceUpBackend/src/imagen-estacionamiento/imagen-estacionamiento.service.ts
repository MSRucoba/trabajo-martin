import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagenEstacionamiento } from './imagen-estacionamiento.entity';
import { CreateImagenEstacionamientoDto } from './dto/create-imagen-estacionamiento.dto';
import { UpdateImagenEstacionamientoDto } from './dto/update-imagen-estacionamiento.dto';
import { ImagenTipo } from './imagen-tipo.enum';
import { deleteFile } from '../util/cloud_storage';

@Injectable()
export class ImagenEstacionamientoService {
  constructor(
    @InjectRepository(ImagenEstacionamiento)
    private repo: Repository<ImagenEstacionamiento>,
  ) {}

  async create(dto: CreateImagenEstacionamientoDto) {
    if (dto.tipo === ImagenTipo.GALERIA) {
      const count = await this.repo.count({
        where: {
          id_estacionamiento: dto.id_estacionamiento,
          tipo: ImagenTipo.GALERIA,
        },
      });
      if (count >= 5) {
        throw new BadRequestException(
          'Un estacionamiento solo puede tener hasta 5 imágenes en galería',
        );
      }
    }

    const nueva = this.repo.create(dto);
    return this.repo.save(nueva);
  }

  findAll() {
    return this.repo.find({ relations: ['estacionamiento'] });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id_imagen: id },
      relations: ['estacionamiento'],
    });
  }

  update(id: number, dto: UpdateImagenEstacionamientoDto) {
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    const imagen = await this.repo.findOne({ where: { id_imagen: id } });
    if (!imagen) throw new NotFoundException('Imagen no encontrada');

    await this.deleteFromStorage(imagen.url);
    await this.repo.delete(id);

    return { message: 'Imagen eliminada correctamente' };
  }

  async findExistingImage(estacionamientoId: number, tipo: ImagenTipo) {
    return await this.repo.findOne({
      where: { id_estacionamiento: estacionamientoId, tipo },
    });
  }

  async deleteFromStorage(url: string) {
    if (!url) return;
    await deleteFile(url);
  }
}
