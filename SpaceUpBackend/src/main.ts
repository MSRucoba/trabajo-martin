import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // CORS configurable: '*' en desarrollo o dominios específicos en producción
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins.split(',').map((o) => o.trim())
      : process.env.NODE_ENV === 'production'
        ? false
        : '*',
    credentials: true,
  });

  const uploadDir =
    configService.get<string>('UPLOAD_DIR') ||
    path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const PORT = configService.get<number>('PORT', 3000);
  await app.listen(PORT, '0.0.0.0');

  logger.log(`Backend corriendo en puerto ${PORT}`);
}

bootstrap();
