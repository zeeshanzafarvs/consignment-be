import 'reflect-metadata';
import { DataSource } from 'typeorm';

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'consignment',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

runMigrations();