import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EmpleadoEmpresaService } from './empleado-empresa.service';
import { CreateEmpleadoEmpresaDto } from './dto/create-empleado-empresa.dto';
import { UpdateEmpleadoEmpresaDto } from './dto/update-empleado-empresa.dto';
import { EmpleadoEmpresa } from './empleado-empresa.entity';
import { CreateEncargadoDto } from './dto/create-encargado.dto';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('empleado-empresa')
export class EmpleadoEmpresaController {
  constructor(
    private readonly empleadoEmpresaService: EmpleadoEmpresaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION, JwtRole.ADMIN)
  create(@Body() dto: CreateEmpleadoEmpresaDto): Promise<EmpleadoEmpresa> {
    return this.empleadoEmpresaService.create(dto);
  }

  @Post('crear-cuenta')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION, JwtRole.ADMIN)
  createWithAccount(@Req() req, @Body() dto: CreateEncargadoDto) {
    const id_usuario_anfitrion = req.user.id;
    return this.empleadoEmpresaService.createWithAccount(
      dto,
      id_usuario_anfitrion,
    );
  }

  @Get('estacionamiento/:id_estacionamiento')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION, JwtRole.ADMIN)
  async getEncargadoByEstacionamiento(
    @Param('id_estacionamiento', ParseIntPipe) id_estacionamiento: number,
  ) {
    return this.empleadoEmpresaService.findByEstacionamiento(
      id_estacionamiento,
    );
  }

  @Get('empresa/:id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findByEmpresa(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EmpleadoEmpresa[]> {
    return this.empleadoEmpresaService.findByEmpresa(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION)
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpleadoEmpresaDto,
  ): Promise<EmpleadoEmpresa> {
    return this.empleadoEmpresaService.updateEstado(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ANFITRION)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.empleadoEmpresaService.remove(id);
  }
}
