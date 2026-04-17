import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

async function checkConnection() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not found in .env.local");
    return;
  }

  console.log("🔍 Checking connection to:", DATABASE_URL.replace(/:([^@]+)@/, ':****@'));

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to the database!");
    const res = await client.query('SELECT current_database(), current_user');
    console.log("📊 DB Info:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

checkConnection();
