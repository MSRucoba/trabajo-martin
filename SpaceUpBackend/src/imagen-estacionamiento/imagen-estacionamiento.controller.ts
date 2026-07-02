import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ImagenEstacionamientoService } from './imagen-estacionamiento.service';
import { CreateImagenEstacionamientoDto } from './dto/create-imagen-estacionamiento.dto';
import { UpdateImagenEstacionamientoDto } from './dto/update-imagen-estacionamiento.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from '../util/cloud_storage';
import { ImagenTipo } from './imagen-tipo.enum';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('imagenes-estacionamiento')
export class ImagenEstacionamientoController {
  constructor(private readonly service: ImagenEstacionamientoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  create(@Body() dto: CreateImagenEstacionamientoDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION, JwtRole.ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  update(@Param('id') id: number, @Body() dto: UpdateImagenEstacionamientoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debe enviar una imagen');
    }

    const url = await storage(
      file,
      `estacionamientos/${Date.now()}_${file.originalname}`,
    );

    return { url };
  }

  @Post('upload-file')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debe enviar una imagen');
    }

    const url = await storage(
      file,
      `estacionamientos/temp/${Date.now()}_${file.originalname}`,
    );

    return { url };
  }
}
