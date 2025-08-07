import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createId } from '@paralleldrive/cuid2';
import { app } from '../src/app';
import { prisma, setupTestDatabase, teardownTestDatabase, createTestUser } from './setup';

describe('Chat Application Integration Tests', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDatabase();
    testUser = await prisma.user.create({
      data: createTestUser({ username: 'integrationuser' })
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete user-group-message workflow', async () => {
      // 1. Create a new user
      const newUserResponse = await request(app)
        .post('/users')
        .send({ username: 'workflowuser' })
        .expect(201);

      const newUser = newUserResponse.body;

      // 2. Create a group
      const groupData = {
        id: createId(),
        name: 'Workflow Test Group',
        createdBy: newUser.id,
        updatedAt: new Date().toISOString()
      };

      const groupResponse = await request(app)
        .post('/groups')
        .send(groupData)
        .expect(200);

      const group = groupResponse.body;

      // 3. Send a message to the group
      const messageData = {
        id: createId(),
        groupId: group.id,
        senderId: newUser.id,
        body: 'Hello from workflow test!',
        createdAt: new Date().toISOString()
      };

      const messageResponse = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(200);

      expect(messageResponse.body.id).toBe(messageData.id);

      // 4. Verify message appears in events
      const eventsResponse = await request(app)
        .get('/events/messages')
        .query({ since: 0, limit: 10, userId: newUser.id })
        .expect(200);

      const messageEvent = eventsResponse.body.events.find((e: any) => e.id === messageData.id);
      expect(messageEvent).toBeDefined();
      expect(messageEvent.body).toBe(messageData.body);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce unique group names globally', async () => {
      const groupName = 'Unique Name Test';

      // Create first group
      const firstGroupData = {
        id: createId(),
        name: groupName,
        createdBy: testUser.id,
        updatedAt: new Date().toISOString()
      };

      await request(app)
        .post('/groups')
        .send(firstGroupData)
        .expect(200);

      // Create second user
      const secondUser = await prisma.user.create({
        data: createTestUser({ username: 'seconduser' })
      });

      // Try to create second group with same name - should fail
      const secondGroupData = {
        id: createId(),
        name: groupName,
        createdBy: secondUser.id,
        updatedAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/groups')
        .send(secondGroupData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should handle message idempotency', async () => {
      // Create group
      const groupData = {
        id: createId(),
        name: 'Idempotency Test Group',
        createdBy: testUser.id,
        updatedAt: new Date().toISOString()
      };

      const groupResponse = await request(app)
        .post('/groups')
        .send(groupData)
        .expect(200);

      const group = groupResponse.body;

      // Send same message twice
      const messageData = {
        id: createId(),
        groupId: group.id,
        senderId: testUser.id,
        body: 'Idempotent message',
        createdAt: new Date().toISOString()
      };

      const [response1, response2] = await Promise.all([
        request(app).post('/messages').send(messageData),
        request(app).post('/messages').send(messageData)
      ]);

      // Both should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.id).toBe(messageData.id);
      expect(response2.body.id).toBe(messageData.id);
    });
  });

  describe('Network Failure Simulation', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidData = {
        id: 'invalid-id-format',
        name: 'Test Group',
        createdBy: testUser.id,
        updatedAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/groups')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid group ID');
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Group'
        // Missing id, createdBy, updatedAt
      };

      const response = await request(app)
        .post('/groups')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle non-existent user references', async () => {
      const invalidData = {
        id: createId(),
        name: 'Test Group',
        createdBy: createId(), // Non-existent user
        updatedAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/groups')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
    });
  });
});