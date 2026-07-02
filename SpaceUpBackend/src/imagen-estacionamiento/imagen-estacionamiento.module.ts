import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagenEstacionamiento } from './imagen-estacionamiento.entity';
import { ImagenEstacionamientoService } from './imagen-estacionamiento.service';
import { ImagenEstacionamientoController } from './imagen-estacionamiento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ImagenEstacionamiento])],
  controllers: [ImagenEstacionamientoController],
  providers: [ImagenEstacionamientoService],
})
export class ImagenEstacionamientoModule {}
