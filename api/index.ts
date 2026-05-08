import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

const expressApp = express();

export const config = {
  api: {
    bodyParser: false,
  },
};

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.enableCors();
    app.setGlobalPrefix('api'); // important for Vercel routing
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

export default async function handler(req, res) {
  await bootstrap();
  expressApp(req, res);
}
