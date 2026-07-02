import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Usuario } from '../usuario/usuario.entity';
import { Empresa } from '../empresa/empresa.entity';
import { ReniecService } from '../usuario/reniec.service';
import { SunatService } from '../empresa/sunat.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { jwtConstants } from './jwt/jwt.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Empresa]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: {},
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ReniecService, SunatService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
