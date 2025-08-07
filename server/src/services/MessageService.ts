import type { MessageRepository } from '../repositories/MessageRepository.js';
import type { GroupRepository } from '../repositories/GroupRepository.js';
import type { UserService } from './UserService.js';
import type { MembershipRepository } from '../repositories/MembershipRepository.js';
import type { CreateMessageDto, MessageResponseDto } from '../models/Message.js';

export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private groupRepository: GroupRepository,
    private userService: UserService,
    private membershipRepository: MembershipRepository
  ) {}

  async createMessage(messageData: CreateMessageDto): Promise<MessageResponseDto> {
    // Validate sender exists
    const sender = await this.userService.getUserById(messageData.senderId);
    if (!sender) {
      throw new Error('User not found');
    }

    // Validate group exists
    const group = await this.groupRepository.findById(messageData.groupId);
    if (!group) {
      throw new Error('Group not found or deleted');
    }

    try {
      const message = await this.messageRepository.create(messageData);
      
      return {
        ...message,
        senderUsername: sender.username
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Return existing message for idempotency
        const existingMessage = await this.messageRepository.findById(messageData.id);
        if (existingMessage) {
          return {
            ...existingMessage,
            senderUsername: sender.username
          };
        }
      }
      throw error;
    }
  }

  async getMessagesByUserGroups(userId: string, sinceSeq: number, limit: number): Promise<any[]> {
    // Get user's group memberships for privacy filtering
    const userGroupIds = await this.membershipRepository.findUserGroupIds(userId);
    
    if (userGroupIds.length === 0) {
      return [];
    }

    return await this.messageRepository.findByGroupIds(userGroupIds, sinceSeq, limit);
  }

  async getAllMessages(sinceSeq: number, limit: number): Promise<any[]> {
    return await this.messageRepository.findByServerSeq(sinceSeq, limit);
  }
}
