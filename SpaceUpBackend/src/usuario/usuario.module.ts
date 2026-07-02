import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './usuario.controller';
import { UsersService } from './usuario.service';
import { Usuario } from './usuario.entity';
import { ReniecService } from './reniec.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsersController],
  providers: [UsersService, ReniecService],
  exports: [UsersService],
})
export class UsuarioModule {}
