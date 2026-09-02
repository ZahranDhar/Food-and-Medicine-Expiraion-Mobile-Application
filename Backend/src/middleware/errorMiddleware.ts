import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import AppError from '../utils/AppError';

/**
 * errorMiddleware — central error handler for all Express errors.
 *
 * All thrown AppErrors and unexpected errors are caught here and converted
 * into consistent JSON responses: { success: false, message: "..." }
 */
const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = err.statusCode || 500;
  let message: string = err.message || 'An unexpected error occurred';

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors as Record<string, any>)
      .map((e: any) => e.message)
      .join('. ');
    message = messages;
  }

  // ── Mongoose Duplicate Key (E11000) ────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'email') {
      message = 'An account with this email already exists';
    } else if (field === 'username') {
      message = 'Username is already taken';
    } else {
      message = `Duplicate value for field: ${field}`;
    }
  }

  // ── Mongoose CastError (invalid ObjectId) ─────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // ── JWT errors (handled in middleware but catch-all here too) ─────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // ── Multer file errors ────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    const limitMb = process.env.MAX_FILE_SIZE_MB || '5';
    message = `File is too large. Maximum allowed size is ${limitMb} MB.`;
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field in request.';
  }

  // ── Network stream & request abortion errors ──────────────────────────────
  if (err.message === 'Request aborted' || err.code === 'ECONNRESET') {
    statusCode = 400;
    message = 'Image upload stream was aborted or interrupted by client.';
  }

  // ── Log unexpected (non-operational) errors ───────────────────────────────
  if (!err.isOperational && statusCode === 500) {
    console.error('💥 Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;
