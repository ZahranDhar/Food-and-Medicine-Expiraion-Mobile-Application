import { Router } from 'express';
import { extractExpiry } from '../controllers/ocrController';
import protect from '../middleware/authMiddleware';
import uploadMemory from '../middleware/uploadMemoryMiddleware';

const router = Router();

// All OCR routes require authentication so the endpoint cannot be abused publicly.
router.use(protect);

/**
 * POST /api/ocr/extract
 *
 * Body: multipart/form-data
 *   image  — image file (JPEG, PNG, WEBP, GIF, HEIC)
 *
 * Response 200:
 *   { success, ocrText, parseResult: { expirationDate, confidence, source, ... } }
 */
router.post('/extract', uploadMemory.single('image'), extractExpiry);

export default router;
