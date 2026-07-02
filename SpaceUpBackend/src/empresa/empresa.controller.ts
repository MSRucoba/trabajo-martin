import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './empresa.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  create(@Body() dto: CreateEmpresaDto): Promise<Empresa> {
    return this.empresaService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  findAll(): Promise<Empresa[]> {
    return this.empresaService.findAll();
  }

  @Get('verificar/:ruc')
  verificarRuc(@Param('ruc') ruc: string) {
    return this.empresaService.verificarRuc(ruc);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Empresa> {
    return this.empresaService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
  ): Promise<Empresa> {
    return this.empresaService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.empresaService.remove(id);
  }
}
