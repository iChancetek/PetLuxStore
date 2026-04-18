import { auth } from '../server/firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log("🔥 Firebase Admin Auth Status:", auth ? "Initialized ✅" : "Not Initialized ❌");
if (!auth) {
  console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "Present ✅" : "Missing ❌");
  console.log("PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "Present ✅" : "Missing ❌");
}
