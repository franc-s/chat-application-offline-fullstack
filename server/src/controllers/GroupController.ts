import type { Request, Response } from 'express';
import type { GroupService } from '../services/GroupService.js';
import { guard, validateId, validateGroupName } from '../utils/validation.js';

export class GroupController {
  constructor(private groupService: GroupService) {}

  createOrUpdateGroup = async (req: Request, res: Response): Promise<void> => {
    const { id, name, createdBy, updatedAt } = req.body;

    // Use guard function for validation - frontend generates ID and timestamp
    if (!guard([
      () => validateId(id, 'group ID'),
      () => validateGroupName(name),
      () => validateId(createdBy, 'createdBy user ID'),
      () => {
        if (!updatedAt || typeof updatedAt !== 'string') {
          throw new Error('updatedAt is required and must be a string');
        }
        // Validate ISO date format
        if (isNaN(Date.parse(updatedAt))) {
          throw new Error('updatedAt must be a valid ISO date string');
        }
        return null; // Guard expects null for success
      }
    ], res)) {
      return;
    }

    try {
      const group = await this.groupService.createOrUpdateGroup({
        id, name, createdBy, updatedAt
      });
      res.json(group);
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  deleteGroup = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { userId } = req.body;

    // Use guard function for validation - CUID2 validation
    if (!guard([
      () => id ? validateId(id, 'group ID') : 'Group ID is required',
      () => validateId(userId, 'user ID')
    ], res)) {
      return;
    }

    try {
      const group = await this.groupService.deleteGroup(id!, { userId });
      res.json(group);
    } catch (error: any) {
      if (error.message === 'Invalid user - user not found') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'Group not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === 'Only the group creator can delete this group') {
        res.status(403).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  joinGroup = async (req: Request, res: Response): Promise<void> => {
    const { id: groupId } = req.params;
    const { userId } = req.body;
    
    // Use guard function for validation - CUID-only validation
    if (!guard([
      () => groupId ? validateId(groupId, 'group ID') : 'Group ID is required',
      () => validateId(userId, 'user ID')
    ], res)) {
      return;
    }

    try {
      const result = await this.groupService.joinGroup(groupId!, { userId });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Invalid user - user not found') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'Group not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  getAllGroups = async (_req: Request, res: Response): Promise<void> => {
    const groups = await this.groupService.getAllGroups();
    res.json(groups);
  };
}
