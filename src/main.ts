import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const trustProxy = process.env.TRUST_PROXY;
  app.set('trust proxy', trustProxy === 'false' || trustProxy === '0' ? false : (trustProxy ?? 1));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get('Reflector')));

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Consignment Management API')
    .setDescription('Consignment management system API documentation')
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
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Cities', 'City master data')
    .addTag('Branches', 'Branch master data')
    .addTag('ItemTypes', 'Item type master data')
    .addTag('Customers', 'Customer management')
    .addTag('RateLists', 'Rate list configuration')
    .addTag('Consignments', 'Consignment/booking management')
    .addTag('Vehicles', 'Vehicle master data')
    .addTag('Drivers', 'Driver master data')
    .addTag('DispatchManifests', 'Dispatch manifest/loading')
    .addTag('Payments', 'Payment management')
    .addTag('Expenses', 'Expense management')
    .addTag('Dashboard', 'Dashboard statistics')
    .addTag('Reports', 'Report generation')
    .addTag('Seed', 'Database seeding')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerName: string, methodName: string) => `${controllerName}_${methodName}`,
  });
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    customCss: `
      .swagger-ui .opblock .opblock-summary-authorization { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 2.5em; }
    `,
    customSiteTitle: 'Consignment API Docs',
    customfavIcon: '/favicon.ico',
  });

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}
bootstrap();