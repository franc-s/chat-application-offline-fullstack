import { Router } from 'express';
import type { UserController } from '../controllers/UserController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // POST /users - Create user
  router.post('/', asyncHandler(userController.createUser));

  // GET /users/id/:id - Get user by ID
  router.get('/id/:id', asyncHandler(userController.getUserById));

  // GET /users/:username - Get user by username (must be last to avoid conflicts)
  router.get('/:username', asyncHandler(userController.getUserByUsername));

  return router;
}
