import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!admin.apps.length) {
  try {
    let credential;

    const primaryPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./server/config/firebase-admin-sdk.json";
    const fallbackPath = "./privatekey.json";
    const serviceAccountPath = fs.existsSync(primaryPath) ? primaryPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
    
    if (serviceAccountPath) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        
        // Fix potential newline escaping (common in JSON literals)
        if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
        }
        
        credential = admin.credential.cert(serviceAccount);
        console.log(`🔥 Firebase Admin initialized using: ${serviceAccountPath}`);
      } catch (fileError: any) {
        console.warn(`⚠️ Failed to parse service account file (${serviceAccountPath}):`, fileError.message);
      }
    } else {
      console.log("ℹ️ No service account JSON file found. Checking environment variables...");
    }

    if (!credential && projectId && clientEmail && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        // Essential: Convert literal \n strings back to real newlines and trim whitespace
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").trim();
        
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        });
        console.log("🔥 Firebase Admin initialized using environment variables.");
      } catch (certError: any) {
        console.error("❌ Failed to create Firebase credential from environment variables:", certError.message);
      }
    }

    if (credential) {
      admin.initializeApp({
        credential,
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    } else {
      console.warn("⚠️ Firebase Admin could not be initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local");
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin:", error);
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export const storage = admin.apps.length ? admin.storage() : null;
export default admin;
