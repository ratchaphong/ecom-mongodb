import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // ตัดฟิลด์ที่ไม่อยู่ใน DTO ออก
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Ecom API')
    .setDescription('Simple e-commerce API (NestJS + MongoDB)')
    .setVersion('1.0.0')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
