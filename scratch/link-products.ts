import { db } from '../server/db';
import { products, categories } from '../shared/schema';
import { eq, ilike } from 'drizzle-orm';

async function link() {
  const allCategories = await db.select().from(categories);
  const bedsCat = allCategories.find(c => c.slug === 'beds');
  const collarsCat = allCategories.find(c => c.slug === 'collars');

  if (bedsCat) {
    console.log('Linking beds...');
    await db.update(products)
      .set({ categoryId: bedsCat.id })
      .where(ilike(products.name, '%bed%'));
  }

  if (collarsCat) {
    console.log('Linking collars...');
    await db.update(products)
      .set({ categoryId: collarsCat.id })
      .where(ilike(products.name, '%collar%'));
  }

  console.log('✅ Linking complete!');
  process.exit(0);
}

link().catch(console.error);
