import type { Request, Response } from 'express';
import type { UserService } from '../services/UserService.js';
import { guard, validateUsername, validateId } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class UserController {
  constructor(private userService: UserService) {}

  createUser = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.body;
    
    // Use guard function for validation
    if (!guard([
      () => validateUsername(username)
    ], res)) {
      return;
    }

    try {
      const user = await this.userService.createUser({ username });
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message === 'Username already taken') {
        res.status(409).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  getUserByUsername = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;

    // Use guard function for validation
    if (!guard([
      () => !username ? 'Username is required' : null,
      () => username ? validateUsername(username) : null
    ], res)) {
      return;
    }

    const user = await this.userService.getUserByUsername(username!);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Use guard function for validation
    if (!guard([
      () => !id ? 'User ID is required' : null,
      () => id ? validateId(id, 'user ID') : null
    ], res)) {
      return;
    }

    const user = await this.userService.getUserById(id!);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  };
}
