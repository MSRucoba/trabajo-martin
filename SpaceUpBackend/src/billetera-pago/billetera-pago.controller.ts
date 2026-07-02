import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Patch,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BilleteraPagoService } from './billetera-pago.service';
import { CreateBilleteraPagoDto } from './dto/create-billetera-pago.dto';
import { BilleteraPago } from './billetera-pago.entity';
import { HasRoles } from 'src/auth/jwt/has-role';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

@Controller('billetera-pago')
export class BilleteraPagoController {
  constructor(private readonly billeteraService: BilleteraPagoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async create(
    @Body() dto: CreateBilleteraPagoDto,
  ): Promise<ApiResponse<BilleteraPago>> {
    const existingCount = await this.billeteraService.countByUsuario(
      dto.id_usuario,
    );

    if (existingCount === 0) {
      dto.predeterminado = true;
    }

    const metodo = await this.billeteraService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Método de pago guardado correctamente',
      data: metodo,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id_usuario')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async getAll(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
  ): Promise<ApiResponse<BilleteraPago[]>> {
    const metodos = await this.billeteraService.getByUsuario(id_usuario);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lista de métodos de pago del usuario',
      data: metodos,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id_usuario/:id_billetera/predeterminado')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async setPredeterminado(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
    @Param('id_billetera', ParseIntPipe) id_billetera: number,
  ): Promise<ApiResponse<BilleteraPago>> {
    const metodo = await this.billeteraService.setPredeterminada(
      id_usuario,
      id_billetera,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Método de pago establecido como predeterminado',
      data: metodo,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id_usuario/:id_billetera')
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @HasRoles(JwtRole.ADMIN, JwtRole.CONDUCTOR)
  async delete(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
    @Param('id_billetera', ParseIntPipe) id_billetera: number,
  ): Promise<ApiResponse<null>> {
    await this.billeteraService.delete(id_usuario, id_billetera);
    return {
      statusCode: HttpStatus.OK,
      message: 'Método de pago eliminado correctamente',
      timestamp: new Date().toISOString(),
    };
  }
}
