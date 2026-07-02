import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsuariosWebService } from './usuarios-web.service';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('web/usuarios-admin')
export class UsuariosWebController {
  constructor(private readonly usuariosWebService: UsuariosWebService) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getAllWithPagination(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const result = await this.usuariosWebService.getAllWithDetails(
      page || 1,
      limit || 10,
    );
    return {
      success: true,
      message: 'Usuarios obtenidos correctamente',
      data: result,
    };
  }
}
