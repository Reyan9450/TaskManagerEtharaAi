import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
  isJoi?: boolean;
  code?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyValue?: Record<string, any>;
}

/**
 * errorHandler
 *
 * Centralised Express error-handling middleware. Must be registered last in
 * the middleware chain (after all routes).
 *
 * Maps known error types to appropriate HTTP status codes and returns a
 * consistent `{ error, details? }` JSON shape.
 *
 * Requirements: 12.1, 12.2
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // `next` is required as the 4th parameter for Express to recognise this as
  // an error-handling middleware, even though it is not used here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log errors in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Joi validation error
  if (err.isJoi === true || err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    res.status(409).json({ error: 'Duplicate entry', details: err.keyValue });
    return;
  }

  // Errors with an explicit status code set by the application
  if (err.status) {
    const status = err.status;

    if (status === 401) {
      res.status(401).json({ error: err.message });
      return;
    }

    if (status === 403) {
      res.status(403).json({ error: err.message });
      return;
    }

    if (status === 404) {
      res.status(404).json({ error: err.message });
      return;
    }

    if (status === 422) {
      res.status(422).json({ error: err.message });
      return;
    }

    // Any other explicit status
    res.status(status).json({ error: err.message });
    return;
  }

  // Default: internal server error
  res.status(500).json({ error: 'Internal server error' });
}
