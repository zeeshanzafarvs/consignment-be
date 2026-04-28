import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'consignment',
  entities: ['src/**/*.entity.ts'],
});

async function updateProfits() {
  await ds.initialize();
  console.log('Connected to database');

  // Get all closed manifests
  const manifests = await ds.query(`SELECT id FROM dispatch_manifests WHERE status = 'CLOSED'`);
  console.log('Found', manifests.length, 'closed manifests');

  for (const manifest of manifests) {
    // Get manifest items with consignment using correct column name
    const items = await ds.query(
      `SELECT c."totalAmount" FROM manifest_items mi
       JOIN consignments c ON mi."consignmentId" = c.id
       WHERE mi."manifestId" = $1`,
      [manifest.id]
    );

    const totalRevenue = items.reduce((sum: number, item: any) => sum + Number(item.totalAmount || 0), 0);

    // Get expenses
    const expenses = await ds.query(
      `SELECT amount FROM expenses WHERE "manifestId" = $1`,
      [manifest.id]
    );

    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
    const profit = Number((totalRevenue - totalExpenses).toFixed(2));

    // Update manifest
    await ds.query(
      `UPDATE dispatch_manifests SET profit = $1 WHERE id = $2`,
      [profit, manifest.id]
    );

    console.log(`Updated manifest ${manifest.id}: revenue=${totalRevenue}, expenses=${totalExpenses}, profit=${profit}`);
  }

  await ds.destroy();
  console.log('Done!');
}

updateProfits().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
