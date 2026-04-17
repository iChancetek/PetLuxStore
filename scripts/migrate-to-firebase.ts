import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL; // Neon
const NEW_DATABASE_URL = process.env.DATABASE_URL;     // Cloud SQL

async function migrate() {
  if (!OLD_DATABASE_URL || !NEW_DATABASE_URL) {
    console.error("Missing OLD_DATABASE_URL or DATABASE_URL in .env.local");
    return;
  }

  const oldPool = new Pool({ connectionString: OLD_DATABASE_URL });
  const newPool = new Pool({ connectionString: NEW_DATABASE_URL });
  
  const oldDb = drizzle(oldPool, { schema });
  const newDb = drizzle(newPool, { schema });

  console.log("🚀 Starting migration from Neon to Cloud SQL...");

  try {
    // 1. Categories
    console.log("📦 Migrating categories...");
    const categories = await oldDb.select().from(schema.categories);
    if (categories.length > 0) {
      await newDb.insert(schema.categories).values(categories).onConflictDoNothing();
      console.log(`✅ Migrated ${categories.length} categories.`);
    }

    // 2. Products
    console.log("🏷️ Migrating products...");
    const products = await oldDb.select().from(schema.products);
    if (products.length > 0) {
      await newDb.insert(schema.products).values(products).onConflictDoNothing();
      console.log(`✅ Migrated ${products.length} products.`);
    }

    // 3. User metadata (Note: Firebase Auth users are separate, but we keep the DB metadata)
    console.log("👤 Migrating user metadata...");
    const users = await oldDb.select().from(schema.users);
    if (users.length > 0) {
      await newDb.insert(schema.users).values(users).onConflictDoNothing();
      console.log(`✅ Migrated ${users.length} user records.`);
    }

    // 4. Orders
    console.log("🛒 Migrating orders...");
    const orders = await oldDb.select().from(schema.orders);
    if (orders.length > 0) {
      await newDb.insert(schema.orders).values(orders).onConflictDoNothing();
      console.log(`✅ Migrated ${orders.length} orders.`);
    }

    // 5. Order items
    console.log("📝 Migrating order items...");
    const items = await oldDb.select().from(schema.orderItems);
    if (items.length > 0) {
      await newDb.insert(schema.orderItems).values(items).onConflictDoNothing();
      console.log(`✅ Migrated ${items.length} order items.`);
    }

    console.log("✨ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

migrate();
 Greenland
