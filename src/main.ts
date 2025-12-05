import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
   app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           
      forbidNonWhitelisted: true, 
      transform: true,           
      transformOptions: {
        enableImplicitConversion: true, 
      },
    }),
  );
  app.enableCors({
    origin: ['http://localhost:3000', 'https://inkluzi.my.id', 'https://inkluzi.vercel.app', 'http://localhost:3001'],
    credentials: true,
  })

   const config = new DocumentBuilder()
    .setTitle('Inkluzi MBG API Documentation')
    .setDescription('API Documentation for Inkluzi MBG Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', 
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
