import { PrismaClient } from '@prisma/client';

export interface Membership {
  userId: string;
  groupId: string;
  joinedAt: Date;
  leftAt?: Date;
}

export class MembershipRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, groupId: string): Promise<void> {
    await this.prisma.membership.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId }
    });
  }

  async findUserGroupIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, leftAt: null },
      select: { groupId: true }
    });
    return memberships.map(m => m.groupId);
  }

  async isMember(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_groupId: { userId, groupId } },
      select: { userId: true }
    });
    return !!membership;
  }
}
