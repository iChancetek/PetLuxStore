import type { Express } from "express";
import multer from "multer";
import { storage as firebaseStorage } from "./firebase-admin";
import { isAuthenticated, isAdmin } from "./auth/authMiddleware";
import { randomUUID } from "crypto";

// Multer in-memory storage (we'll upload directly to Firebase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export function registerUploadRoutes(app: Express): void {
  app.post(
    "/api/admin/uploads/image",
    isAuthenticated,
    isAdmin,
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }

        if (!firebaseStorage) {
          return res.status(500).json({ error: "Firebase Storage not initialized" });
        }

        const bucket = firebaseStorage.bucket();
        const ext = req.file.originalname.split('.').pop();
        const filename = `products/${randomUUID()}.${ext}`;
        const file = bucket.file(filename);

        // Upload to Firebase Storage
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
          },
          public: true,
        });

        // Get Public URL
        // In Firebase/GCS, public URL usually follows this format
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        res.json({
          success: true,
          imageUrl,
          filename,
          originalName: req.file.originalname,
          size: req.file.size,
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload image to Firebase Storage" });
      }
    }
  );
}
