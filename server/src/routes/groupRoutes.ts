import { Router } from 'express';
import type { GroupController } from '../controllers/GroupController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export function createGroupRoutes(groupController: GroupController): Router {
  const router = Router();

  // POST /groups - Create or update group
  router.post('/', asyncHandler(groupController.createOrUpdateGroup));

  // GET /groups - Get all non-deleted groups
  router.get('/', asyncHandler(groupController.getAllGroups));

  // DELETE /groups/:id - Soft delete group
  router.delete('/:id', asyncHandler(groupController.deleteGroup));

  // POST /groups/:id/join - Join group
  router.post('/:id/join', asyncHandler(groupController.joinGroup));

  return router;
}
