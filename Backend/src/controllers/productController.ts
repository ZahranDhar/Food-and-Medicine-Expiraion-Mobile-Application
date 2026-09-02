import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import { extractTextFromBuffer } from '../services/ocrService';
import { parseExpirationDate } from '../services/expirationParser';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';

const MIN_OCR_CONFIDENCE = 0.5;

/**
 * Validate a MongoDB ObjectId and throw a clean 400 if invalid.
 */
function validateObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid product ID: ${id}`, 400);
  }
}

// ─── GET /api/products ────────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const products = await Product.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  validateObjectId(id);

  const product = await Product.findById(id).lean();

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (String(product.userId) !== userId) {
    throw new AppError('You are not authorized to access this product', 403);
  }

  res.status(200).json({ success: true, product });
});

// ─── POST /api/products ───────────────────────────────────────────────────────
/**
 * Create a product using TWO distinct images:
 *   1. labelImage: processed by OCR.space + expirationParser -> expirationDate. NOT stored permanently.
 *   2. productImage: actual product photograph -> uploaded to Cloudinary -> secure_url stored in MongoDB.
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  console.log('[PRODUCT CONTROLLER] reached');
  const userId = req.userId!;
  const user = req.user!;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const labelFile = files?.['labelImage']?.[0] || req.file;
  const productFile = files?.['productImage']?.[0] || req.file;

  if (!labelFile) {
    throw new AppError(
      'Label image (labelImage) is required for OCR expiration date extraction.',
      400
    );
  }

  if (!productFile) {
    throw new AppError(
      'Product photograph (productImage) is required to be uploaded to Cloudinary.',
      400
    );
  }

  const { title, category } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Product title is required', 400);
  }

  // ── 1. OCR — extract text from labelImage buffer ──────────────────────────
  let ocrText: string;
  try {
    ocrText = await extractTextFromBuffer(labelFile.buffer);
    console.log('[OCR] completed');
    console.log(`[OCR] extracted text length: ${ocrText.length}`);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('OCR service failed. Please try again later.', 502);
  }

  // ── 2. Parse — determine expiration date ──────────────────────────────────
  const parseResult = parseExpirationDate(ocrText);
  console.log(`[PARSER] expirationDate: ${parseResult.expirationDate}`);
  console.log(`[PARSER] confidence: ${parseResult.confidence}`);

  // ── 3. Reject if extraction was not reliable (HTTP 422) ───────────────────
  // Label image is discarded here; product image is NOT uploaded to Cloudinary.
  if (!parseResult.expirationDate || parseResult.confidence < MIN_OCR_CONFIDENCE) {
    return res.status(422).json({
      success: false,
      message:
        'Could not reliably determine the expiration date from the label image. ' +
        'Please ensure the expiration label is clearly visible and retry.',
      ocrText: ocrText.trim() || null,
      parseResult,
    });
  }

  // ── 4. Upload productImage to Cloudinary ──────────────────────────────────
  console.log('[CLOUDINARY] upload starting');
  const { secure_url, public_id } = await uploadBufferToCloudinary(
    productFile.buffer,
    'food-expiry/products'
  );
  console.log('[CLOUDINARY] upload completed');

  // ── 5. Create product document in MongoDB ─────────────────────────────────
  console.log('[MONGODB] product creation starting');
  let product;
  try {
    product = await Product.create({
      title: title.trim(),
      image: secure_url,
      cloudinaryPublicId: public_id,
      email: user.email,
      expirationDate: parseResult.expirationDate,
      category: category || 'Other',
      userId,
    });
    console.log('[MONGODB] product creation completed');
  } catch (dbErr) {
    // Attempt cleanup of newly uploaded Cloudinary image if DB save fails
    await deleteFromCloudinary(public_id);
    throw dbErr;
  }

  res.status(201).json({
    success: true,
    product,
    ocrMeta: {
      confidence: parseResult.confidence,
      source: parseResult.source,
      rawMatch: parseResult.rawMatch,
      manufacturingDate: parseResult.manufacturingDate,
      shelfLife: parseResult.shelfLife,
    },
  });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  validateObjectId(id);

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (String(product.userId) !== userId) {
    throw new AppError('You are not authorized to update this product', 403);
  }

  const { title, category, expirationDate } = req.body;

  if (title !== undefined) {
    if (!title.trim()) throw new AppError('Title cannot be empty', 400);
    product.title = title.trim();
  }

  if (category !== undefined) {
    product.category = category;
  }

  if (expirationDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      throw new AppError('expirationDate must be in YYYY-MM-DD format', 400);
    }
    product.expirationDate = expirationDate;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const labelFile = files?.['labelImage']?.[0];
  const productFile = files?.['productImage']?.[0] || req.file;

  // If new labelImage provided, run OCR to update expiration date
  if (labelFile) {
    let ocrText: string;
    try {
      ocrText = await extractTextFromBuffer(labelFile.buffer);
    } catch {
      throw new AppError('OCR service failed while processing the new label image.', 502);
    }

    const parseResult = parseExpirationDate(ocrText);
    if (parseResult.expirationDate && parseResult.confidence >= MIN_OCR_CONFIDENCE) {
      if (expirationDate === undefined) {
        product.expirationDate = parseResult.expirationDate;
      }
    }
  }

  // If new productImage provided, upload to Cloudinary and update product.image
  if (productFile) {
    const oldPublicId = product.cloudinaryPublicId;
    const { secure_url, public_id } = await uploadBufferToCloudinary(
      productFile.buffer,
      'food-expiry/products'
    );
    product.image = secure_url;
    product.cloudinaryPublicId = public_id;

    if (oldPublicId) {
      deleteFromCloudinary(oldPublicId).catch(() => {});
    }
  }

  await product.save();

  res.status(200).json({ success: true, product });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  validateObjectId(id);

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (String(product.userId) !== userId) {
    throw new AppError('You are not authorized to delete this product', 403);
  }

  if (product.cloudinaryPublicId) {
    await deleteFromCloudinary(product.cloudinaryPublicId);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});
