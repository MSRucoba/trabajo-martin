import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './usuario.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dtp';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  create(@Body() userDto: CreateUserDto) {
    return this.usersService.create(userDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.ANFITRION)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(
    JwtRole.ADMIN,
    JwtRole.ANFITRION,
    JwtRole.ENCARGADO,
    JwtRole.CONDUCTOR,
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get('verificar/:dni')
  verificarDni(@Param('dni') dni: string) {
    return this.usersService.verificarDni(dni);
  }

  @Patch(':id/imagen')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(
    JwtRole.ADMIN,
    JwtRole.ANFITRION,
    JwtRole.ENCARGADO,
    JwtRole.CONDUCTOR,
  )
  @UseInterceptors(FileInterceptor('imagen'))
  async updateImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateImage(id, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(id, updateDto);
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(id, dto);
  }
}
