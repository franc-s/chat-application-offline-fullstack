import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/chat_app_test'
    }
  }
});

export async function setupTestDatabase() {
  // Clean up test data
  await prisma.message.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
}

export async function teardownTestDatabase() {
  await prisma.$disconnect();
}

// Test data factories with proper CUID generation
export function createTestUser(overrides: Partial<any> = {}) {
  return {
    id: createId(),
    username: `testuser${Date.now()}`,
    createdAt: new Date(),
    ...overrides
  };
}

export function createTestGroup(createdBy: string, overrides: Partial<any> = {}) {
  return {
    id: createId(),
    name: `Test Group ${Date.now()}`,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createTestMessage(groupId: string, senderId: string, overrides: Partial<any> = {}) {
  return {
    id: createId(),
    groupId,
    senderId,
    body: `Test message ${Date.now()}`,
    createdAt: new Date(),
    ...overrides
  };
}
