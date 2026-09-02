import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// ─── Initialize Cloudinary Config ─────────────────────────────────────────────

export function initCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (
    cloud_name &&
    api_key &&
    api_secret &&
    cloud_name !== 'your_cloudinary_cloud_name'
  ) {
    cloudinary.config({
      cloud_name: cloud_name.trim(),
      api_key: api_key.trim(),
      api_secret: api_secret.trim(),
      secure: true,
    });
  }
}

// Ensure config runs on load
initCloudinary();

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Helper to check if live Cloudinary credentials are configured.
 */
export function isCloudinaryConfigured(): boolean {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(
    cloud_name &&
      api_key &&
      api_secret &&
      cloud_name !== 'your_cloudinary_cloud_name' &&
      !cloud_name.includes('your_') &&
      !api_secret.includes('*') &&
      !api_secret.includes('your_')
  );
}

/**
 * Upload an image buffer to Cloudinary using upload_stream.
 * Fallback to local /uploads storage if Cloudinary credentials are not yet configured in .env.
 *
 * @param buffer  In-memory file buffer (from Multer)
 * @param folder  Cloudinary target folder name
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string = 'food-expiry/products'
): Promise<CloudinaryUploadResult> {
  // If live Cloudinary credentials are set in .env, perform Cloudinary stream upload
  if (isCloudinaryConfigured()) {
    initCloudinary();

    const timestamp = Math.floor(Date.now() / 1000);
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    const api_key = process.env.CLOUDINARY_API_KEY;

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, api_secret!);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          timestamp,
          signature,
          api_key,
        },
        (error, result) => {
          if (error || !result) {
            const msg = error?.message || 'Cloudinary upload failed';
            return reject(new AppError(`Cloudinary upload failed: ${msg}`, 502));
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  // ── Dev Fallback ─────────────────────────────────────────────────────────────
  // If Cloudinary credentials are placeholders, save to /uploads so dev testing works
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  const port = process.env.PORT || 3000;
  const devUrl = `http://localhost:${port}/uploads/${filename}`;

  return {
    secure_url: devUrl,
    public_id: `local-uploads/${filename}`,
  };
}

/**
 * Delete an image asset from Cloudinary using its public_id.
 *
 * @param publicId  The Cloudinary public_id of the asset to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;

  if (publicId.startsWith('local-uploads/')) {
    const filename = publicId.replace('local-uploads/', '');
    const filepath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.warn(`Failed to delete local upload file ${filepath}:`, err);
      }
    }
    return;
  }

  if (!isCloudinaryConfigured()) return;

  initCloudinary();

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err: any) {
    console.warn(`Failed to delete asset ${publicId} from Cloudinary:`, err?.message || err);
  }
}

export default {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured,
};
