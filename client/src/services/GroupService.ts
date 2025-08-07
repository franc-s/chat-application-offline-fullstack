import { db, type Group } from '../lib/db';
import { syncService } from '../lib/sync';
import type { UserData } from './UserService';
import { createId } from '@paralleldrive/cuid2';

export class GroupService {
  private static readonly API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174';

  async getGroups(): Promise<Group[]> {
    try {
      const groups = await db.groups.toArray();
      return groups;
    } catch (error) {
      console.error('Failed to get groups:', error);
      return [];
    }
  }

  /**
   * Create group with offline-first ID generation and consistent data structure
   */
  async createGroup(name: string, user: UserData, isOnline: boolean): Promise<Group> {
    this.validateGroupCreationInput(name, user);
    const groupName = name.trim();

    await this.validateUniqueGroupName(groupName);
    const groupData = this.createGroupData(groupName, user.userId);

    try {
      if (isOnline) {
        return await this.createGroupOnline(groupData);
      } else {
        return await this.createGroupOffline(groupData);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  private validateGroupCreationInput(name: string, user: UserData): void {
    const groupName = name?.trim();

    if (!groupName) {
      throw new Error('Group name cannot be empty');
    }

    if (!user?.userId) {
      throw new Error('User information is required');
    }

    if (groupName.length < 2) {
      throw new Error('Group name must be at least 2 characters');
    }

    if (groupName.length > 50) {
      throw new Error('Group name too long (max 50 characters)');
    }
  }

  private async validateUniqueGroupName(groupName: string): Promise<void> {
    const existingGroup = await db.groups
      .where('name')
      .equalsIgnoreCase(groupName)
      .first();

    if (existingGroup) {
      throw new Error('Group name already exists');
    }
  }

  /**
   * Generate consistent CUID and timestamp for offline-first architecture
   */
  private createGroupData(name: string, createdBy: string) {
    const id = createId();
    const timestamp = new Date().toISOString();

    return {
      id,
      name,
      createdBy,
      updatedAt: timestamp
    };
  }

  private async createGroupOnline(groupData: ReturnType<typeof this.createGroupData>): Promise<Group> {
    const createdGroup = await syncService.writeOnlineFirst('group', groupData);
    return this.validateAndCastGroup(createdGroup);
  }

  private async createGroupOffline(groupData: ReturnType<typeof this.createGroupData>): Promise<Group> {
    const group: Group = this.convertToGroupObject(groupData);

    await db.groups.add(group);
    await syncService.addToOutbox('group', groupData);

    return group;
  }

  private convertToGroupObject(groupData: ReturnType<typeof this.createGroupData>): Group {
    return {
      ...groupData,
      updatedAt: new Date(groupData.updatedAt)
    };
  }

  /**
   * Runtime type validation for backend responses with detailed error messages
   */
  private validateAndCastGroup(response: unknown): Group {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from backend: not an object');
    }

    const group = response as Record<string, unknown>;

    if (!('id' in group) || typeof group.id !== 'string') {
      throw new Error('Invalid response from backend: missing or invalid id');
    }

    if (!('name' in group) || typeof group.name !== 'string') {
      throw new Error('Invalid response from backend: missing or invalid name');
    }

    if (!('createdBy' in group) || typeof group.createdBy !== 'string') {
      throw new Error('Invalid response from backend: missing or invalid createdBy');
    }

    return response as Group;
  }

  /**
   * Hard delete with CASCADE cleanup of related messages and memberships
   */
  async deleteGroup(groupId: string, user: UserData, isOnline: boolean): Promise<void> {
    if (!groupId) {
      throw new Error('Invalid group ID');
    }

    const group = await db.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.createdBy !== user.userId) {
      throw new Error('Only the group creator can delete this group');
    }

    const deleteData = {
      id: groupId,
      userId: user.userId
    };

    try {
      if (isOnline) {
        // Online: Write to backend first (LWW approach)
        await syncService.writeOnlineFirst('delete-group', deleteData);
      } else {
        // Offline: Remove from local DB and queue for sync
        await db.groups.delete(groupId);
        // Also remove related messages and memberships
        await db.messages.where('groupId').equals(groupId).delete();
        await db.memberships.where('groupId').equals(groupId).delete();
        await syncService.addToOutbox('delete-group', deleteData);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }

  /**
   * Join a group (create membership)
   */
  async joinGroup(groupId: string, user: UserData, isOnline: boolean): Promise<void> {
    try {
      const membership = {
        userId: user.userId,
        groupId,
        joinedAt: new Date()
      };

      if (isOnline) {
        // Online: Write to backend first
        const response = await fetch(`${GroupService.API_BASE}/groups/${groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to join group');
        }

        // Update local DB
        await db.memberships.put(membership);
      } else {
        // Offline: Write to local DB and queue for sync
        await db.memberships.put(membership);
        await syncService.addToOutbox('membership', membership);
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  }

  /**
   * Check if user is a member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const membership = await db.memberships.get([userId, groupId]);
      return !!membership;
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }

  /**
   * Get user's group memberships
   */
  async getUserGroups(userId: string): Promise<string[]> {
    try {
      const memberships = await db.memberships.where('userId').equals(userId).toArray();
      return memberships.map(m => m.groupId);
    } catch (error) {
      console.error('Failed to get user groups:', error);
      return [];
    }
  }
}
