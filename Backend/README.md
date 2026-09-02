# Expiry Tracker — Backend API

Node.js + Express + MongoDB + TypeScript backend for the Food & Medicine Expiration Tracker mobile application.

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set MONGODB_URI, JWT_SECRET
```

### 3. Start MongoDB

Make sure MongoDB is running locally (`mongod`) or set `MONGODB_URI` to a MongoDB Atlas connection string.

### 4. Run the development server

```bash
npm run dev
```

The server starts on **http://localhost:3000**.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry duration |
| `MAX_FILE_SIZE_MB` | No | `5` | Max image upload size in MB |
| `OCR_SPACE_API_KEY` | **Yes** | — | Free API key from https://ocr.space/ocrapi |

---

## OCR Setup (OCR.space)

1. Create a free OCR.space account & API key at [https://ocr.space/ocrapi](https://ocr.space/ocrapi).
2. Add your key to `Backend/.env`:
   ```env
   OCR_SPACE_API_KEY=your_ocr_space_api_key_here
   ```
3. Start MongoDB.
4. Start the backend (`npm run dev`).
5. Start the Expo/React Native frontend.
6. Test product image upload!

---

## API Reference

### Base URL
- iOS Simulator / Web: `http://localhost:3000/api`
- Android Emulator:    `http://10.0.2.2:3000/api`

All authenticated routes require:
```
Authorization: Bearer <token>
```

---

### Auth Endpoints

#### `POST /api/auth/signup`
Create a new account.

**Body (JSON)**
```json
{
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response 201**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "_id": "...",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

---

#### `POST /api/auth/login`

**Body (JSON)**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**Response 200** — same shape as signup.

---

#### `GET /api/auth/me` 🔒
Returns the current authenticated user. Called by the app on launch to validate the stored token.

---

### Product Endpoints (all require auth)

#### `GET /api/products`
Returns all products belonging to the authenticated user, sorted newest first.

**Response 200**
```json
{
  "success": true,
  "count": 3,
  "products": [
    {
      "_id": "...",
      "title": "Organic Milk",
      "image": "http://localhost:3000/uploads/product-1234.jpg",
      "email": "john@example.com",
      "expirationDate": "2026-09-15",
      "category": "Dairy",
      "createdAt": "2026-08-09T13:00:00.000Z",
      "updatedAt": "2026-08-09T13:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/products`
Create a product. Accepts **multipart/form-data** (for file upload) or **JSON** (for URL).

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | **Yes** | |
| `image` | file | No* | Multer `image` field |
| `imageUrl` | string | No* | Remote URL alternative |
| `category` | string | No | Defaults to `'Other'` |
| `expirationDate` | string | No | YYYY-MM-DD; auto-generated if omitted |

*Either `image` (file) or `imageUrl` (string) must be provided.

---

#### `GET /api/products/:id` 🔒
Returns a single product. Responds 403 if the product belongs to another user.

#### `PUT /api/products/:id` 🔒
Update a product. Same fields as POST. Ownership enforced.

#### `DELETE /api/products/:id` 🔒
Delete a product. Returns `{ success: true, message: "..." }`. Ownership enforced.

---

## Project Structure

```
backend/
  src/
    config/
      db.ts               # Mongoose connection
    controllers/
      authController.ts   # signup, login, getCurrentUser
      productController.ts # CRUD
    middleware/
      authMiddleware.ts   # JWT protect
      errorMiddleware.ts  # Central error handler
      uploadMiddleware.ts # Multer config
    models/
      User.ts
      Product.ts
    routes/
      authRoutes.ts
      productRoutes.ts
    utils/
      AppError.ts         # Custom error class
      asyncHandler.ts     # Async controller wrapper
    server.ts             # Entry point
  uploads/                # Uploaded images (add CDN/S3 here later)
  .env.example
  .gitignore
  package.json
  tsconfig.json
  README.md
```

---

## MongoDB Schemas

### User
```
username      String  required  unique
firstName     String  required
lastName      String  required
email         String  required  unique  lowercase
password      String  required  (bcrypt hashed, select: false)
createdAt     Date    (auto)
updatedAt     Date    (auto)
```

### Product
```
title         String  required
image         String  required   (URL or /uploads/<file>)
email         String  required   (owner's email — denormalised for frontend compat)
expirationDate String required   YYYY-MM-DD
category      String  default:'Other'
userId        ObjectId required  ref: User  (server-side ownership)
createdAt     Date    (auto)
updatedAt     Date    (auto)
```

---

## Image Storage

Uploaded images are stored in `backend/uploads/` and served at `/uploads/<filename>`.

To switch to S3 or another cloud provider:
1. Install `multer-s3` (or `@aws-sdk/client-s3`)
2. Replace the `storage` engine in `src/middleware/uploadMiddleware.ts`
3. No other files need to change.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JS from `dist/` |
