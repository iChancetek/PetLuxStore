import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './server/config/firebase-admin-sdk.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized successfully from JSON file!');
  process.exit(0);
} catch (error: any) {
  console.error('❌ Firebase Admin initialization failed from JSON file:');
  console.error(error.message);
  process.exit(1);
}
