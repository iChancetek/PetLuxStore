import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function createDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not found");
    return;
  }

  const baseUrl = url.split('/').slice(0, -1).join('/') + '/postgres';
  console.log("Connecting to:", baseUrl.replace(/:([^@]+)@/, ':****@'));

  const pool = new Pool({ 
    connectionString: baseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("Creating database 'ipetluxestore-database'...");
    await client.query('CREATE DATABASE "ipetluxestore-database"');
    console.log("✅ Database created successfully!");
    client.release();
  } catch (err) {
    console.error("❌ Failed to create database:", err.message);
  } finally {
    await pool.end();
  }
}

createDatabase();
