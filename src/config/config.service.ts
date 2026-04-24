import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get database(): {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  } {
    return {
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_DATABASE', 'consignment'),
    };
  }

  get jwt(): {
    secret: string;
    expiresIn: string;
  } {
    return {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }

  get mail(): {
    host: string;
    port: number;
    user: string;
    pass: string;
  } {
    return {
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      user: this.configService.get<string>('MAIL_USER', ''),
      pass: this.configService.get<string>('MAIL_PASS', ''),
    };
  }

  get app(): {
    port: number;
    host: string;
    frontendUrl: string;
  } {
    return {
      port: this.configService.get<number>('PORT', 3000),
      host: this.configService.get<string>('HOST', '0.0.0.0'),
      frontendUrl: this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001'),
    };
  }
}