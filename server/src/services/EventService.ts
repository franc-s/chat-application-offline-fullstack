import type { MessageService } from './MessageService.js';
import type { GroupService } from './GroupService.js';
import type { MessageEventDto, GroupEventDto } from '../models/Message.js';
import { logger } from '../utils/logger.js';

export class EventService {
  constructor(
    private messageService: MessageService,
    private groupService: GroupService
  ) {}



  async getMessageEvents(userId: string, sinceSeq: number, limit: number): Promise<MessageEventDto[]> {
    const messages = await this.messageService.getMessagesByUserGroups(userId, sinceSeq, limit);
    
    return messages.map(msg => ({
      type: 'message',
      id: msg.id,
      groupId: msg.groupId,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt,
      serverSeq: msg.serverSeq,
      senderUsername: msg.sender.username
    }));
  }

  async getGroupEvents(sinceSeq: number, limit: number): Promise<GroupEventDto[]> {
    const groups = await this.groupService.getGroupsByServerSeq(sinceSeq, limit);
    
    return groups.map(group => ({
      type: 'group',
      id: group.id,
      name: group.name,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: group.deletedAt,
      serverSeq: group.serverSeq,
      createdByUsername: group.creator.username
    }));
  }
}
