import mongoose, { Document, Schema } from 'mongoose';

// ─── Valid categories — mirrors the frontend CATEGORIES constant ──────────────

export const VALID_CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Meat',
  'Seafood',
  'Medicines',
  'Canned Goods',
  'Beverages',
  'Snacks',
  'Frozen',
  'Other',
] as const;

export type ProductCategory = (typeof VALID_CATEGORIES)[number];

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  image: string;         // Cloudinary secure URL (remote)
  cloudinaryPublicId?: string; // Optional Cloudinary public_id for asset deletion
  email: string;         // owner's email — included so frontend filter works as-is
  expirationDate: string; // YYYY-MM-DD
  category: string;
  userId: mongoose.Types.ObjectId; // server-side ownership reference
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // Denormalized from the user for frontend compatibility.
      // The authoritative ownership check is always done via userId.
    },
    expirationDate: {
      type: String,
      required: [true, 'Expiration date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'expirationDate must be in YYYY-MM-DD format'],
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ─── Index to speed up "my products" queries ─────────────────────────────────

productSchema.index({ userId: 1, createdAt: -1 });

// ─── Clean up __v from JSON output ───────────────────────────────────────────

productSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc, ret: Record<string, any>) {
    ret['__v'] = undefined;
    return ret;
  },
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
