import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import AppError from '../utils/AppError';

// ─── MIME type allow-list ─────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, GIF, HEIC.`,
        415
      )
    );
  }
};

// ─── File size limit ──────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10);

// ─── Multer — memory storage ──────────────────────────────────────────────────
// Files live only in req.file.buffer; nothing is written to disk.
// This keeps OCR processing fully separate from permanent image storage.
// If OCR fails or the product is not created, there is nothing to clean up.

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 2,
  },
});

export default uploadMemory;
