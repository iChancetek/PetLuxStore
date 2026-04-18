import { db } from '../server/db';
import { categories } from '../shared/schema';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function seedCategories() {
  const data = [
    { name: 'Beds', slug: 'beds', description: 'Comfortable beds for dogs and cats' },
    { name: 'Collars', slug: 'collars', description: 'Stylish and functional collars' },
    { name: 'Toys', slug: 'toys', description: 'Fun toys for your pets' },
    { name: 'Food', slug: 'food', description: 'Nutritious food and treats' },
  ];

  console.log('📦 Seeding categories...');
  
  for (const item of data) {
    await db.insert(categories).values(item).onConflictDoNothing();
  }

  console.log('✅ Categories seeded!');
  process.exit(0);
}

seedCategories().catch(console.error);
