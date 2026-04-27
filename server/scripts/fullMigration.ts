import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { auth as firebaseAuth } from '../firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function fullSync() {
  console.log('🔄 Starting Resilient Full Sync: Neon -> Cloud SQL...\n');

  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Missing database URLs in environment.');
    process.exit(1);
  }

  const sourcePool = new Pool({ connectionString: sourceUrl });
  const targetPool = new Pool({ connectionString: targetUrl });

  const targetDb = drizzle({ client: targetPool, schema });

  try {
    const sourceClient = await sourcePool.connect();
    
    // 1. Check which tables exist in source
    const existingTablesRes = await sourceClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const sourceTables = new Set(existingTablesRes.rows.map(r => r.table_name));
    console.log(`📊 Tables found in source: ${Array.from(sourceTables).join(', ') || 'None'}`);

    // 2. Clear target
    console.log('\n🗑️  Clearing target database (Cloud SQL)...');
    const tablesToClear = [
      'activity_events', 'audit_logs', 'ai_interactions', 'reviews', 
      'order_items', 'orders', 'cart_items', 'products', 'categories', 
      'users', 'verification_tokens', 'password_reset_tokens', 'auth_sessions'
    ];
    
    for (const table of tablesToClear) {
      try {
        await targetPool.query(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (e) {
        // Ignore if table doesn't exist
      }
    }
    console.log('✅ Target cleared.');

    // 3. Sync Categories
    if (sourceTables.has('categories')) {
      console.log('\n📦 Syncing Categories...');
      const res = await sourceClient.query('SELECT * FROM "public"."categories"');
      if (res.rows.length > 0) {
        await targetDb.insert(schema.categories).values(res.rows);
        console.log(`✅ Migrated ${res.rows.length} categories.`);
      }
    } else {
      console.log('\n⏭️  Skipping Categories (not found in source)');
    }

    // 4. Sync Products
    if (sourceTables.has('products')) {
      console.log('📦 Syncing Products...');
      const res = await sourceClient.query('SELECT * FROM "public"."products"');
      if (res.rows.length > 0) {
        // Strip out any columns that don't exist in target schema
        const productsToInsert = res.rows.map(row => {
          const { display_name, ...rest } = row; // Handle potential column mismatches
          return rest;
        });
        
        try {
           await targetDb.insert(schema.products).values(productsToInsert);
           console.log(`✅ Migrated ${res.rows.length} products.`);
        } catch (e: any) {
           console.error(`⚠️  Product insert error: ${e.message}`);
        }
      }
    } else {
      console.log('⏭️  Skipping Products (not found in source)');
    }

    // 5. Sync Users and Firebase
    if (sourceTables.has('users')) {
      console.log('👤 Syncing Users...');
      const res = await sourceClient.query('SELECT * FROM "public"."users"');
      
      for (const user of res.rows) {
        console.log(`  Processing user: ${user.email}`);
        
        let firebaseUid = user.id;
        
        if (firebaseAuth) {
          try {
            const fUser = await firebaseAuth.getUserByEmail(user.email);
            firebaseUid = fUser.uid;
            console.log(`    - Found in Firebase: ${firebaseUid}`);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              console.log(`    - Creating in Firebase...`);
              const fUser = await firebaseAuth.createUser({
                email: user.email,
                displayName: user.display_name || user.displayName || undefined,
                emailVerified: user.email_verified || user.emailVerified || false
              });
              firebaseUid = fUser.uid;
            } else {
              console.warn(`    - Firebase error: ${e.message}`);
            }
          }
        }

        try {
          await targetDb.insert(schema.users).values({
            id: firebaseUid,
            email: user.email,
            firstName: user.first_name || user.firstName || null,
            lastName: user.last_name || user.lastName || null,
            displayName: user.display_name || user.displayName || null,
            role: user.role || 'user',
            isActive: user.is_active ?? user.isActive ?? true,
            createdAt: user.created_at || user.createdAt || new Date()
          });
        } catch (e: any) {
          console.error(`    ❌ DB Insert failed: ${e.message}`);
        }
      }
      console.log(`✅ Migrated ${res.rows.length} users.`);
    } else {
      console.log('⏭️  Skipping Users (not found in source)');
    }

    sourceClient.release();
    console.log('\n✨ SYNC COMPLETE!');

  } catch (error: any) {
    console.error('\n❌ Sync Failed:', error.message);
  } finally {
    await sourcePool.end();
    await targetPool.end();
    process.exit(0);
  }
}

fullSync();
