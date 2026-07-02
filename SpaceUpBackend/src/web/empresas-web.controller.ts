import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EmpresasWebService } from './empresas-web.service';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('web/empresas-admin')
export class EmpresasWebController {
  constructor(private readonly empresasWebService: EmpresasWebService) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getAllWithPagination(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const result = await this.empresasWebService.getAllWithDetails(
      page || 1,
      limit || 10,
    );
    return {
      success: true,
      message: 'Empresas obtenidas correctamente',
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN)
  async getOneWithDetails(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const empresa = await this.empresasWebService.getOneWithDetails(id);
    return {
      success: true,
      message: 'Empresa obtenida correctamente',
      data: empresa,
    };
  }
}
