import { PrismaClient } from '@prisma/client';
import type { Group, CreateGroupDto } from '../models/Group.js';

export class GroupRepository {
  constructor(private prisma: PrismaClient) {}

  async create(groupData: CreateGroupDto & { id: string; updatedAt: string }): Promise<Group> {
    return await this.prisma.group.create({
      data: {
        id: groupData.id,
        name: groupData.name.trim(),
        createdBy: groupData.createdBy,
        updatedAt: new Date(groupData.updatedAt)
      }
    });
  }

  async upsert(groupData: CreateGroupDto & { id: string; updatedAt: string }): Promise<Group> {
    return await this.prisma.group.upsert({
      where: { id: groupData.id },
      update: {
        name: groupData.name.trim(),
        updatedAt: new Date(groupData.updatedAt)
      },
      create: {
        id: groupData.id,
        name: groupData.name.trim(),
        createdBy: groupData.createdBy,
        updatedAt: new Date(groupData.updatedAt)
      }
    });
  }

  async findById(id: string): Promise<Group | null> {
    return await this.prisma.group.findFirst({
      where: { id }
    });
  }

  async findByName(name: string): Promise<Group | null> {
    return await this.prisma.group.findFirst({
      where: {
        name: name.trim()
      }
    });
  }

  async findAll(): Promise<Group[]> {
    return await this.prisma.group.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: {
          select: { username: true }
        }
      }
    });
  }

  async delete(id: string): Promise<Group> {
    return await this.prisma.group.delete({
      where: { id }
    });
  }

  async findByServerSeq(sinceSeq: number, limit: number): Promise<Group[]> {
    return await this.prisma.group.findMany({
      where: {
        serverSeq: { gt: sinceSeq }
      },
      orderBy: { serverSeq: 'asc' },
      include: {
        creator: {
          select: { username: true }
        }
      },
      take: limit
    });
  }

  async exists(id: string): Promise<boolean> {
    const group = await this.prisma.group.findFirst({
      where: { id },
      select: { id: true }
    });
    return !!group;
  }
}
