import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function check() {
  const pool = new Pool({ connectionString: process.env.OLD_DATABASE_URL });
  const db = drizzle(pool, { schema });

  const users = await db.select().from(schema.users).limit(5);
  console.log(users);
  
  process.exit(0);
}
check();
