import { Router } from 'express';
import type { EventController } from '../controllers/EventController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export function createEventRoutes(eventController: EventController): Router {
  const router = Router();

  // GET /events/messages - Get message events with privacy filtering
  router.get('/messages', asyncHandler(eventController.getMessageEvents));

  // GET /events/groups - Get group events (public)
  router.get('/groups', asyncHandler(eventController.getGroupEvents));

  return router;
}
