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
import { TarifaService } from './tarifa.service';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';
import { Tarifa } from './tarifa.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('tarifa')
export class TarifaController {
  constructor(private readonly tarifaService: TarifaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  create(@Body() dto: CreateTarifaDto): Promise<Tarifa> {
    return this.tarifaService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findAll(): Promise<Tarifa[]> {
    return this.tarifaService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Tarifa> {
    return this.tarifaService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTarifaDto,
  ): Promise<Tarifa> {
    return this.tarifaService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION, JwtRole.ENCARGADO)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tarifaService.remove(id);
  }
}
