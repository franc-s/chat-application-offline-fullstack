import { db, type Message } from '../lib/db';
import { syncService } from '../lib/sync';
import type { UserData } from './UserService';
import { createId } from '@paralleldrive/cuid2';

export class MessageService {

  async getMessages(groupId: string): Promise<Message[]> {
    try {
      const messages = await db.messages.where('groupId').equals(groupId).toArray();
      return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Send message with offline-first ID generation and consistent timestamps
   */
  async sendMessage(
    groupId: string,
    body: string,
    user: UserData,
    isOnline: boolean
  ): Promise<Message> {
    this.validateMessageInput(body, groupId, user);
    const messageBody = body.trim();
    const message = this.createMessageData(groupId, messageBody, user.userId);

    try {
      if (isOnline) {
        return await this.sendMessageOnline(message);
      } else {
        return await this.sendMessageOffline(message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  private validateMessageInput(body: string, groupId: string, user: UserData): void {
    const messageBody = body?.trim();

    if (!messageBody) {
      throw new Error('Message cannot be empty');
    }

    if (!groupId) {
      throw new Error('Please select a group first');
    }

    if (!user?.userId) {
      throw new Error('User information is required');
    }

    if (messageBody.length > 500) {
      throw new Error('Message too long (max 500 characters)');
    }
  }

  /**
   * Generate consistent CUID and timestamp for offline-first architecture
   */
  private createMessageData(groupId: string, body: string, senderId: string): Message {
    const id = createId();
    const createdAt = new Date();

    return {
      id,
      groupId,
      senderId,
      body,
      createdAt,
      status: 'sending'
    };
  }

  private createMessageDto(message: Message) {
    return {
      id: message.id,
      groupId: message.groupId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString()
    };
  }

  private async sendMessageOnline(message: Message): Promise<Message> {
    const messageDto = this.createMessageDto(message);
    await syncService.writeOnlineFirst('message', messageDto);
    return message;
  }

  private async sendMessageOffline(message: Message): Promise<Message> {
    await db.messages.add(message);
    const messageDto = this.createMessageDto(message);
    await syncService.addToOutbox('message', messageDto);
    return message;
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: 'sending' | 'sent' | 'failed'): Promise<void> {
    try {
      await db.messages.update(messageId, { status });
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  }

  /**
   * Get messages with resolved usernames for display
   */
  async getMessagesWithUsernames(groupId: string, usernameResolver: (userId: string) => Promise<string>): Promise<(Message & { senderUsername: string })[]> {
    try {
      const messages = await this.getMessages(groupId);
      
      // Resolve usernames for all unique sender IDs
      const uniqueSenderIds = [...new Set(messages.map(m => m.senderId))];
      const usernamePromises = uniqueSenderIds.map(async (senderId) => ({
        senderId,
        username: await usernameResolver(senderId)
      }));
      
      const resolvedUsernames = await Promise.all(usernamePromises);
      const usernameMap = new Map(resolvedUsernames.map(r => [r.senderId, r.username]));
      
      // Add resolved usernames to messages
      return messages.map(message => ({
        ...message,
        senderUsername: usernameMap.get(message.senderId) || message.senderId
      }));
    } catch (error) {
      console.error('Failed to get messages with usernames:', error);
      return [];
    }
  }

  /**
   * Clear all messages (for development/testing)
   */
  async clearAllMessages(): Promise<void> {
    try {
      await db.messages.clear();
    } catch (error) {
      console.error('Failed to clear messages:', error);
      throw error;
    }
  }
}
