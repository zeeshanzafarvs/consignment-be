import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLicenseNoToDriver1700000000000 implements MigrationInterface {
  name = 'AddLicenseNoToDriver1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ADD COLUMN "licenseNo" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "drivers" DROP COLUMN "licenseNo"
    `);
  }
}
