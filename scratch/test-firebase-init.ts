import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

console.log('--- DBG: ENV VARS ---');
console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);
console.log('Private Key (Length):', privateKeyRaw?.length);

if (!projectId || !clientEmail || !privateKeyRaw) {
  console.error('Missing environment variables!');
  process.exit(1);
}

try {
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();
  console.log('--- DBG: NORMALIZED KEY ---');
  console.log('Raw Start:', privateKeyRaw.substring(0, 60));
  console.log('Normalized Start:', privateKey.substring(0, 60));
  console.log('Starts with Header?', privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
  console.log('Ends with Footer?', privateKey.endsWith('-----END PRIVATE KEY-----'));
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  
  console.log('✅ Firebase Admin initialized successfully!');
  process.exit(0);
} catch (error: any) {
  console.error('❌ Firebase Admin initialization failed:');
  console.error(error.message);
  process.exit(1);
}
