import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Raw body needed for Stripe webhook signature verification
  app.use('/payments/webhook', json({ type: 'application/json', verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }}));

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wallet & Transaction Management API')
    .setDescription(
      'API for managing user wallets, money transfers, and transaction history. ' +
      'Register/login to get a Bearer token, then use it to access protected endpoints.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Registration, login, token refresh and logout')
    .addTag('Wallet', 'Balance inquiry and Stripe-powered top-up')
    .addTag('Transactions', 'Transfer money and view history')
    .addTag('Payments', 'Stripe webhook (internal use)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\nWallet API running on: http://localhost:${port}`);
  console.log(`Swagger docs:          http://localhost:${port}/api/docs\n`);
}

bootstrap();
