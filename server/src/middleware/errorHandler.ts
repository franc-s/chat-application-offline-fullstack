import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Async handler wrapper to catch async errors and pass them to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware
 * Should be added at the bottom of the middleware stack
 */
export function errorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle Prisma errors
  if (error.code === 'P2002') {
    // Unique constraint violation
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  if (error.code === 'P2025') {
    // Record not found
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({ error: error.message });
    return;
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : message 
  });
}
