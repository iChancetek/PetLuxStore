import type { Express } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { isAuthenticated, isAdmin, verifyCsrf } from "./auth/authMiddleware";

const UPLOADS_DIR = path.join(process.cwd(), "server", "public", "uploads", "products");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"));
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export function registerUploadRoutes(app: Express): void {
  app.use("/uploads/products", express.static(UPLOADS_DIR, {
    dotfiles: "deny",
    index: false,
  }));

  app.post(
    "/api/admin/uploads/image",
    isAuthenticated,
    isAdmin,
    verifyCsrf,
    upload.single("image"),
    (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;
      res.json({
        success: true,
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    }
  );

  app.use((err: Error, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size must be less than 10MB" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err.message?.includes("Only image files")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  });
}
