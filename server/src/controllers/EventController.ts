import type { Request, Response } from 'express';
import type { EventService } from '../services/EventService.js';
import { guard, validateId } from '../utils/validation.js';

export class EventController {
  constructor(private eventService: EventService) {}



  getMessageEvents = async (req: Request, res: Response): Promise<void> => {
    const { since = 0, limit = 100, userId } = req.query;
    
    // Use guard function for validation
    if (!guard([
      () => {
        const sinceSeq = parseInt(since as string);
        if (isNaN(sinceSeq) || sinceSeq < 0) return 'Invalid since parameter';
        if (sinceSeq > Number.MAX_SAFE_INTEGER) return 'Since parameter too large';
        return null;
      },
      () => {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) return 'Limit must be between 1 and 1000';
        return null;
      },
      () => userId ? validateId(userId as string, 'user ID') : 'User ID is required for privacy filtering'
    ], res)) {
      return;
    }

    const sinceSeq = parseInt(since as string);
    const limitNum = parseInt(limit as string);

    const messageEvents = await this.eventService.getMessageEvents(
      userId as string, 
      sinceSeq, 
      limitNum
    );

    res.json({
      events: messageEvents,
      hasMore: messageEvents.length === limitNum,
      nextCursor: messageEvents.length > 0 ? messageEvents[messageEvents.length - 1]?.serverSeq || sinceSeq : sinceSeq
    });
  };

  getGroupEvents = async (req: Request, res: Response): Promise<void> => {
    const { since = 0, limit = 100 } = req.query;
    
    // Use guard function for validation
    if (!guard([
      () => {
        const sinceSeq = parseInt(since as string);
        if (isNaN(sinceSeq) || sinceSeq < 0) return 'Invalid since parameter';
        if (sinceSeq > Number.MAX_SAFE_INTEGER) return 'Since parameter too large';
        return null;
      },
      () => {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) return 'Limit must be between 1 and 1000';
        return null;
      }
    ], res)) {
      return;
    }

    const sinceSeq = parseInt(since as string);
    const limitNum = parseInt(limit as string);

    const groupEvents = await this.eventService.getGroupEvents(sinceSeq, limitNum);

    res.json({
      events: groupEvents,
      hasMore: groupEvents.length === limitNum,
      nextCursor: groupEvents.length > 0 ? groupEvents[groupEvents.length - 1]?.serverSeq || sinceSeq : sinceSeq
    });
  };
}
