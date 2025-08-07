import type { Request, Response } from 'express';
import type { MessageService } from '../services/MessageService.js';
import { guard, validateId, validateMessageBody, validateTimestamp } from '../utils/validation.js';

export class MessageController {
  constructor(private messageService: MessageService) {}

  createMessage = async (req: Request, res: Response): Promise<void> => {
    const { id, groupId, senderId, body, createdAt } = req.body;

    // Use guard function for validation - all IDs now use CUID format
    if (!guard([
      () => validateId(id, 'message ID'),
      () => validateId(groupId, 'group ID'),
      () => validateId(senderId, 'sender ID'),
      () => validateMessageBody(body),
      () => validateTimestamp(createdAt, 'createdAt')
    ], res)) {
      return;
    }

    try {
      const message = await this.messageService.createMessage({
        id, groupId, senderId, body, createdAt
      });
      res.json(message);
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'Group not found or deleted') {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  };
}
