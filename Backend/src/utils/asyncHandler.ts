import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * asyncHandler — wraps async route handlers so uncaught promise rejections
 * are forwarded to Express's central error middleware instead of crashing.
 */
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
