import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!admin.apps.length) {
  try {
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      // Use service account file if available
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
      console.log("🔥 Firebase Admin initialized using service account file.");
    } else if (projectId && clientEmail && process.env.FIREBASE_PRIVATE_KEY) {
      // Fallback to individual env vars
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
      console.log("🔥 Firebase Admin initialized using environment variables.");
    } else {
      console.warn("⚠️ Firebase Admin could not be initialized. Missing credentials.");
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin:", error);
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export const storage = admin.apps.length ? admin.storage() : null;
export default admin;
