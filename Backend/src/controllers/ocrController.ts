import { Request, Response } from 'express';
import { extractTextFromBuffer } from '../services/ocrService';
import { parseExpirationDate } from '../services/expirationParser';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

// ─── POST /api/ocr/extract ────────────────────────────────────────────────────
/**
 * Standalone OCR + expiration-extraction endpoint.
 *
 * Accepts a single image upload (multipart/form-data, field name: "image").
 * Returns the raw OCR text and the parsed expiration result.
 *
 * This endpoint is useful for:
 *  - Testing the OCR pipeline independently of product creation.
 *  - Frontend pre-flight checks before the user fills in product metadata.
 *
 * Temp-file cleanup: not needed — uploadMemoryMiddleware uses memoryStorage,
 * so the file buffer lives only in req.file.buffer and is GC'd automatically.
 */
export const extractExpiry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('An image file is required (field: "image")', 400);
  }

  // ── OCR ────────────────────────────────────────────────────────────────────
  const ocrText = await extractTextFromBuffer(req.file.buffer);

  if (!ocrText.trim()) {
    return res.status(200).json({
      success: true,
      ocrText: '',
      parseResult: {
        expirationDate: null,
        confidence: 0,
        source: null,
        rawMatch: null,
        manufacturingDate: null,
        shelfLife: null,
      },
      message: 'No text detected in image.',
    });
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  const parseResult = parseExpirationDate(ocrText);

  res.status(200).json({
    success: true,
    ocrText,
    parseResult,
  });
});
