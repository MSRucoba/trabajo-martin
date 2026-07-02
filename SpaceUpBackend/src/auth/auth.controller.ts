import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }
  @Post('fix-password')
  fixPassword(@Body() body: { email: string; newPassword: string }) {
    return this.authService.fixPassword(body.email, body.newPassword);
  }

  @Post('verify-password')
  verifyPassword(@Body() body: { id_usuario: number; password: string }) {
    return this.authService.verifyPassword(body.id_usuario, body.password);
  }
}
