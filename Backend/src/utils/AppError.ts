/**
 * AppError — custom error class with HTTP status code.
 * Thrown from controllers and caught by the central error middleware.
 */
class AppError extends Error {
  public readonly statusCode: number;
  public readonly success: false;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.isOperational = true;

    // Maintains proper stack trace (V8 engines)
    Error.captureStackTrace(this, this.constructor);

    // Fix prototype chain for instanceof checks after transpilation
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export default AppError;
