import { Router, Request, Response, NextFunction } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import protect from '../middleware/authMiddleware';
import uploadMemory from '../middleware/uploadMemoryMiddleware';

const router = Router();

// All product routes require authentication
router.use(protect);

const rawProductUploadFields = uploadMemory.fields([
  { name: 'labelImage', maxCount: 1 },
  { name: 'productImage', maxCount: 1 },
  // Backward compatibility fallback for single-field requests if any
  { name: 'image', maxCount: 1 },
]);

const productUploadFields = (req: Request, res: Response, next: NextFunction) => {
  console.log('[MULTER] starting');
  rawProductUploadFields(req, res, (err: any) => {
    if (err) {
      console.log('[MULTER ERROR]', err);
      return next(err);
    }
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const labelPresent = Boolean(files?.['labelImage']?.[0] || req.file || files?.['image']?.[0]);
    const productPresent = Boolean(files?.['productImage']?.[0] || req.file || files?.['image']?.[0]);

    console.log('[MULTER] completed');
    console.log(`[MULTER] labelImage: ${labelPresent ? 'present' : 'absent'}`);
    console.log(`[MULTER] productImage: ${productPresent ? 'present' : 'absent'}`);
    next();
  });
};

// GET  /api/products  — list current user's products
// POST /api/products  — create a new product (labelImage for OCR + productImage for Cloudinary)
router
  .route('/')
  .get(getProducts)
  .post(productUploadFields, createProduct);

// GET    /api/products/:id — get a single product (ownership enforced)
// PUT    /api/products/:id — update a product (ownership enforced)
// PATCH  /api/products/:id — update a product (ownership enforced)
// DELETE /api/products/:id — delete a product (ownership enforced)
router
  .route('/:id')
  .get(getProductById)
  .put(productUploadFields, updateProduct)
  .patch(productUploadFields, updateProduct)
  .delete(deleteProduct);

export default router;
