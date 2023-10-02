import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('MALT Store API')
    .setDescription('The MALT Store Backend API description')
    .setVersion('1.0')
    .addBearerAuth({type: 'http'})
    .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT);
}
bootstrap();