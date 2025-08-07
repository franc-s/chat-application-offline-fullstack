import type { Request, Response, NextFunction } from 'express';

/**
 * In-memory rate limiting store
 * NOTE: This should be migrated to Redis/window counter for production
 * as documented in the README
 */
interface RateLimitStore {
  [key: string]: number[];
}

const rateLimitStore: RateLimitStore = {};

/**
 * Creates a rate limiting middleware
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns Express middleware function
 */
export function createRateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = [];
    }
    
    // Clean old requests outside the time window
    rateLimitStore[clientId] = rateLimitStore[clientId].filter(time => time > windowStart);
    
    if (rateLimitStore[clientId].length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    rateLimitStore[clientId].push(now);
    next();
  };
}

/**
 * Clears the rate limit store (useful for testing)
 */
export function clearRateLimitStore(): void {
  Object.keys(rateLimitStore).forEach(key => {
    delete rateLimitStore[key];
  });
}
