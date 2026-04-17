import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if it exists, otherwise fall back to .env
const envPath = fs.existsSync(path.resolve(__dirname, '../.env.local')) 
  ? path.resolve(__dirname, '../.env.local')
  : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

console.log(`🌍 Environment loaded from: ${envPath}`);
