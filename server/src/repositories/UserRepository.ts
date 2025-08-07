import { PrismaClient } from '@prisma/client';
import type { User, CreateUserDto } from '../models/User.js';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userData: CreateUserDto): Promise<User> {
    return await this.prisma.user.create({
      data: { username: userData.username }
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username }
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { id: { in: ids } }
    });
  }

  async exists(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });
    return !!user;
  }
}
