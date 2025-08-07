import { Router } from 'express';
import type { MessageController } from '../controllers/MessageController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export function createMessageRoutes(messageController: MessageController): Router {
  const router = Router();

  // POST /messages - Create message
  router.post('/', asyncHandler(messageController.createMessage));

  return router;
}
