import { auth as firebaseAuth } from '../firebase-admin';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

/**
 * Migration script to add database users to Firebase Auth
 * 
 * This script:
 * 1. Fetches all users from the source database (Helium)
 * 2. For each user, ensures they exist in the target database (Cloud SQL)
 * 3. Attempts to create each user in Firebase Auth
 * 4. Updates the database user's ID with the new Firebase UID
 * 5. Handles existing users by skipping or linking
 */

async function migrateToFirebase() {
  console.log('🔄 Starting Firebase Auth migration...\n');

  if (!firebaseAuth) {
    console.error("❌ Firebase Auth not initialized. Check your environment variables.");
    process.exit(1);
  }

  try {
    // 1. Fetch all users from the source database
    console.log('📥 Fetching users from source database (Helium)...');
    
    const sourceUrl = process.env.SOURCE_DATABASE_URL;
    if (!sourceUrl) {
      console.error("❌ SOURCE_DATABASE_URL not set in .env.local");
      process.exit(1);
    }

    const sourcePool = new Pool({ connectionString: sourceUrl });
    const sourceDb = drizzle({ client: sourcePool });

    const allSourceUsers = await sourceDb.select().from(users);
    console.log(`✓ Found ${allSourceUsers.length} total users in source database\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const sourceUser of allSourceUsers) {
      const email = sourceUser.email;
      
      if (!email) {
        console.log(`⚠️  Skipping user ${sourceUser.id} - no email address`);
        skipCount++;
        continue;
      }

      const normalizedEmail = email.toLowerCase();
      console.log(`\n📧 Processing: ${normalizedEmail}`);

      try {
        // 2. Ensure user exists in target database (Cloud SQL)
        let targetUser = await db.query.users.findFirst({
          where: eq(users.email, normalizedEmail)
        });

        if (!targetUser) {
          console.log(`  ➕ User not found in Cloud SQL. Creating record...`);
          [targetUser] = await db.insert(users).values({
            ...sourceUser,
            id: sourceUser.id // Keep original ID for now, will be updated to Firebase UID
          }).returning();
        }

        // 3. Handle Firebase Auth
        let firebaseUser;
        
        try {
          // Check if user already exists in Firebase
          firebaseUser = await firebaseAuth.getUserByEmail(normalizedEmail);
          console.log(`  ⏭️  User already exists in Firebase (UID: ${firebaseUser.uid})`);
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found') {
            console.log(`  📝 Creating account in Firebase Auth...`);
            // Create user in Firebase
            firebaseUser = await firebaseAuth.createUser({
              email: normalizedEmail,
              emailVerified: sourceUser.emailVerified,
              displayName: sourceUser.displayName || `${sourceUser.firstName || ''} ${sourceUser.lastName || ''}`.trim() || undefined,
              photoURL: sourceUser.profileImageUrl || undefined,
            });
          } else {
            throw authError;
          }
        }

        // 4. Link database user to Firebase UID
        if (targetUser.id !== firebaseUser.uid) {
          console.log(`  🔗 Linking database user to Firebase UID ${firebaseUser.uid}...`);
          await db.update(users)
            .set({ id: firebaseUser.uid })
            .where(eq(users.email, normalizedEmail));
          
          console.log(`  ✅ Successfully linked and migrated`);
        } else {
          console.log(`  ✅ Already correctly linked`);
          skipCount++;
        }

        successCount++;

      } catch (error: any) {
        console.error(`  ❌ Migration failed: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FIREBASE MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total source users: ${allSourceUsers.length}`);
    console.log('='.repeat(60) + '\n');

    await sourcePool.end();

    return {
      success: successCount,
      skipped: skipCount,
      errors: errorCount,
      total: allSourceUsers.length,
    };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToFirebase()
  .then((results) => {
    console.log('✅ Migration complete!');
    process.exit(results.errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
