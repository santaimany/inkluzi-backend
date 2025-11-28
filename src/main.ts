import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
   app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Hapus properties yang tidak ada di DTO
      forbidNonWhitelisted: true, // Throw error jika ada property tidak dikenal
      transform: true,            // Auto-transform payload ke DTO instance
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert types (string ke number, dll)
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
