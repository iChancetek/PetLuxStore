import { clerkClient } from '@clerk/express';
import { storage } from '../storage';
import { authService } from '../auth/authService';
import { emailService } from '../auth/emailService';

/**
 * Migration script to export Clerk users and import them into custom auth system
 * 
 * This script:
 * 1. Fetches ALL users from Clerk with pagination
 * 2. Creates accounts in custom auth system with temporary passwords
 * 3. Sends password reset emails to all users
 * 4. Preserves user roles from the database
 * 5. Marks all accounts as email verified (since they were verified in Clerk)
 * 6. Handles email case normalization
 */

interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

async function migrateClerkUsers() {
  console.log('🔄 Starting Clerk user migration...\n');

  try {
    // Fetch ALL Clerk users with pagination
    console.log('📥 Fetching users from Clerk (with pagination)...');
    const allUsers: ClerkUser[] = [];
    let offset = 0;
    const limit = 100; // Process in batches of 100
    
    while (true) {
      const response = await clerkClient.users.getUserList({ 
        limit, 
        offset 
      });
      
      allUsers.push(...response.data as ClerkUser[]);
      console.log(`  Fetched ${allUsers.length} users so far...`);
      
      // If we got fewer users than the limit, we've reached the end
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }
    
    console.log(`✓ Found ${allUsers.length} total Clerk users\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const clerkUser of allUsers) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!email) {
        console.log(`⚠️  Skipping user ${clerkUser.id} - no email address`);
        skipCount++;
        continue;
      }

      console.log(`\n📧 Processing: ${email}`);

      try {
        // IMPORTANT: Normalize email to lowercase for consistent lookups
        const normalizedEmail = email.toLowerCase();
        
        // Check if user already exists in custom auth (using normalized email)
        const existingAuthUser = await storage.getUserByEmail(normalizedEmail);
        
        if (existingAuthUser) {
          console.log(`  ⏭️  Already migrated - skipping`);
          skipCount++;
          continue;
        }

        // Get user's current role from database (if they exist there)
        const existingDbUser = await storage.getUser(clerkUser.id);
        const role = existingDbUser?.role || 'user';

        console.log(`  👤 Role: ${role}`);
        console.log(`  📝 Creating account in custom auth...`);

        // Create user in custom auth system with a temporary password
        // Note: Users will receive a password reset email
        const tempPassword = `temp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        
        // IMPORTANT: Use normalized email when creating user
        const { user: newUser } = await authService.createUser({
          email: normalizedEmail,
          password: tempPassword,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
        });

        // Update user role if needed (admin/reviewer)
        if (role !== 'user') {
          await storage.updateUser(newUser.id, { role });
        }

        // Mark email as verified (they were verified in Clerk)
        await storage.verifyUserEmail(newUser.id);
        console.log(`  ✓ Email verified`);

        // Generate password reset token
        console.log(`  📧 Sending password reset email...`);
        const resetToken = await authService.createPasswordResetToken(normalizedEmail);
        
        // Send the password reset email via email service
        await emailService.sendPasswordResetEmail(
          normalizedEmail,
          resetToken,
          newUser.firstName || undefined
        );
        
        console.log(`  ✓ Password reset email sent`);
        
        successCount++;
        console.log(`  ✅ Migration successful`);

      } catch (error: any) {
        console.error(`  ❌ Migration failed: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${allUsers.length}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('📧 Next steps:');
      console.log('   1. Users will receive password reset emails');
      console.log('   2. They can set new passwords using the reset link');
      console.log('   3. After all users migrate, you can remove Clerk dependencies\n');
    }

    return {
      success: successCount,
      skipped: skipCount,
      errors: errorCount,
      total: allUsers.length,
    };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateClerkUsers()
    .then((results) => {
      console.log('✅ Migration complete!');
      process.exit(results.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { migrateClerkUsers };
