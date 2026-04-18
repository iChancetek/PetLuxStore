import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function checkConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  
  console.log(`\n🔍 Checking connection to Primary (Cloud SQL):`, url.replace(/:([^@]+)@/, ':****@'));
  
  const pool = new Pool({ 
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log(`✅ Successfully connected!`);
    
    // Check tables
    const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("📊 Tables found:", tableRes.rows.map(r => r.table_name));
    
    // Check products count
    try {
      const productRes = await client.query("SELECT count(*) FROM products");
      console.log("📦 Products count:", productRes.rows[0].count);
    } catch (e) {
      console.log("ℹ️ Could not query products table (may not exist yet)");
    }

    client.release();
  } catch (err) {
    console.error(`❌ Connection failed:`, err.message);
  } finally {
    await pool.end();
  }
}

checkConnection();
