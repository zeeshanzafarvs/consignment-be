import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStTaxAndTtTaxToRateList1700000000001 implements MigrationInterface {
  name = 'AddStTaxAndTtTaxToRateList1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rate_lists"
      ADD COLUMN "stTax" numeric(10,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "rate_lists"
      ADD COLUMN "ttTax" numeric(10,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rate_lists" DROP COLUMN "ttTax"
    `);
    await queryRunner.query(`
      ALTER TABLE "rate_lists" DROP COLUMN "stTax"
    `);
  }
}
