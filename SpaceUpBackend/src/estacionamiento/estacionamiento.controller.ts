import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EstacionamientoService } from './estacionamiento.service';
import { CreateEstacionamientoDto } from './dto/create-estacionamiento.dto';
import { UpdateEstacionamientoDto } from './dto/update-estacionamiento.dto';
import { Estacionamiento } from './estacionamiento.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/util/cloud_storage';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('estacionamiento')
export class EstacionamientoController {
  constructor(
    private readonly estacionamientoService: EstacionamientoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  create(@Body() dto: CreateEstacionamientoDto): Promise<Estacionamiento> {
    return this.estacionamientoService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  findAll(): Promise<Estacionamiento[]> {
    return this.estacionamientoService.findAll();
  }

  @Get('activos')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(
    JwtRole.ADMIN,
    JwtRole.ANFITRION,
    JwtRole.ENCARGADO,
    JwtRole.CONDUCTOR,
  )
  findActivos(): Promise<Estacionamiento[]> {
    return this.estacionamientoService.findActivos();
  }

  @Get('empresa/:empresaId')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  findByEmpresa(
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ): Promise<Estacionamiento[]> {
    return this.estacionamientoService.findByEmpresa(empresaId);
  }

  @Get('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  findByUsuario(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<Estacionamiento[]> {
    return this.estacionamientoService.findByUsuario(usuarioId);
  }
  //por si las dudas

  @Get('mi-estacionamiento')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ENCARGADO)
  async getMiEstacionamiento(@Req() req): Promise<Estacionamiento> {
    const id_usuario = req.user.id;
    return this.estacionamientoService.findByUsuarioEncargado(id_usuario);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(
    JwtRole.ADMIN,
    JwtRole.ANFITRION,
    JwtRole.ENCARGADO,
    JwtRole.CONDUCTOR,
  )
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Estacionamiento> {
    return this.estacionamientoService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstacionamientoDto,
  ): Promise<Estacionamiento> {
    return this.estacionamientoService.update(id, dto);
  }

  @Patch(':id/recalcular-cupos')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  recalcularCupos(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Estacionamiento> {
    return this.estacionamientoService.recalcularCuposTotales(id);
  }

  @Patch(':id/activar')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  toggleActivo(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
  ): Promise<Estacionamiento> {
    return this.estacionamientoService.toggleActivo(id, estado);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.estacionamientoService.remove(id);
  }

  @Post('upload-temp')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemp(@UploadedFile() file: Express.Multer.File) {
    const url = await storage(
      file,
      `imagenes/temp/${Date.now()}_${file.originalname}`,
    );
    return { url };
  }

  @Patch(':id_estacionamiento/encargado/:id_encargado')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  async asignarEncargado(
    @Param('id_estacionamiento', ParseIntPipe) id_estacionamiento: number,
    @Param('id_encargado', ParseIntPipe) id_encargado: number,
  ) {
    return this.estacionamientoService.asignarEncargado(
      id_estacionamiento,
      id_encargado,
    );
  }
}
