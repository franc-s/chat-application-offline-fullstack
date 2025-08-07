import type { Response } from 'express';
import { isCuid, createId } from '@paralleldrive/cuid2';

/**
 * Validates if a string is a valid CUID (supports both CUID1 and CUID2)
 */
export function isValidId(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Use official CUID validation - supports both CUID1 and CUID2
  return isCuid(value);
}


/**
 * Validates username format
 */
export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') return 'Username is required';
  
  const trimmed = username.trim().toLowerCase(); // Convert to lowercase for case-insensitive storage
  if (trimmed.length < 2 || trimmed.length > 50) {
    return 'Username must be between 2 and 50 characters';
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return 'Username can only contain letters, numbers, underscore, and dash';
  }
  
  return null;
}

/**
 * Validates message body
 */
export function validateMessageBody(body: string): string | null {
  if (!body || typeof body !== 'string') {
    return 'Message body is required';
  }
  
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return 'Message body cannot be empty';
  }
  
  if (trimmed.length > 500) { // Reduced from 1000 to 500
    return 'Message body must be 500 characters or less';
  }
  
  return null;
}

/**
 * Validates group name
 */
export function validateGroupName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Group name is required';
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return 'Group name must be between 2 and 50 characters';
  }
  
  return null;
}

/**
 * Guard function that validates request parameters and returns 4xx errors
 * before any database calls are made when parameters are invalid
 */
export function guard(
  validations: Array<() => string | null>,
  res: Response
): boolean {
  for (const validation of validations) {
    const error = validation();
    if (error) {
      res.status(400).json({ error });
      return false;
    }
  }
  return true;
}

/**
 * Validates if a field is a valid CUID
 */
export function validateId(value: string, fieldName: string): string | null {
  if (!value || typeof value !== 'string') {
    return `${fieldName} is required`;
  }

  if (!isValidId(value)) {
    return `Invalid ${fieldName} - must be a valid CUID`;
  }

  return null;
}

/**
 * Validates timestamp
 */
export function validateTimestamp(timestamp: string, fieldName: string): string | null {
  if (!timestamp) {
    return `${fieldName} is required`;
  }
  
  if (isNaN(new Date(timestamp).getTime())) {
    return `Invalid ${fieldName} timestamp`;
  }
  
  return null;
}
