import { PrismaClient } from '@prisma/client';
import type { Message, CreateMessageDto } from '../models/Message.js';

export class MessageRepository {
  constructor(private prisma: PrismaClient) {}

  async create(messageData: CreateMessageDto): Promise<Message> {
    return await this.prisma.message.create({
      data: {
        id: messageData.id,
        groupId: messageData.groupId,
        senderId: messageData.senderId,
        body: messageData.body.trim(),
        createdAt: new Date(messageData.createdAt)
      }
    });
  }

  async findById(id: string): Promise<Message | null> {
    return await this.prisma.message.findUnique({
      where: { id }
    });
  }

  async findByGroupIds(groupIds: string[], sinceSeq: number, limit: number): Promise<any[]> {
    return await this.prisma.message.findMany({
      where: {
        serverSeq: { gt: sinceSeq },
        groupId: { in: groupIds }
      },
      orderBy: { serverSeq: 'asc' },
      include: {
        group: true,
        sender: {
          select: { username: true }
        }
      },
      take: limit
    });
  }

  async findByServerSeq(sinceSeq: number, limit: number): Promise<any[]> {
    return await this.prisma.message.findMany({
      where: {
        serverSeq: { gt: sinceSeq }
      },
      orderBy: { serverSeq: 'asc' },
      include: {
        group: true,
        sender: {
          select: { username: true }
        }
      },
      take: limit
    });
  }
}
