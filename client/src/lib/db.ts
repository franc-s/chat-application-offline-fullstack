import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface User {
  id: string;
  username: string;
  createdAt: Date;
  lastSeen?: Date; // Track when we last saw this user
}

export interface Group {
  id: string;
  name: string;
  createdBy: string; // User ID
  updatedAt: Date;
  createdByUsername?: string; // Resolved from backend
  serverSeq?: number; // Server sequence number for sync
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string; // User ID only - username resolved when needed
  body: string;
  createdAt: Date;
  serverSeq?: number;
  status?: 'sending' | 'sent' | 'failed';
}

export interface Membership {
  userId: string;
  groupId: string;
  joinedAt: Date;
}

export interface OutboxItem {
  id: string;
  type: 'group' | 'message' | 'membership' | 'delete-group';
  data: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: Date;
  error?: string;
  retryCount?: number;
  lastAttempt?: Date;
}

export interface SyncMetrics {
  id: string;
  lastSync: Date;
  totalSynced: number;
  failedCount: number;
  avgSyncTime: number;
}

export class ChatDatabase extends Dexie {
  users!: Table<User>;
  groups!: Table<Group>;
  messages!: Table<Message>;
  memberships!: Table<Membership>;
  outbox!: Table<OutboxItem>;
  syncMetrics!: Table<SyncMetrics>;

  constructor() {
    super('ChatDatabase');
    this.version(8).stores({
      users: 'id, username, createdAt, lastSeen',
      groups: 'id, name, createdBy, updatedAt, serverSeq',
      messages: 'id, groupId, senderId, createdAt, serverSeq, status',
      memberships: '[userId+groupId], userId, groupId',
      outbox: 'id, type, status, createdAt, retryCount, lastAttempt',
      syncMetrics: 'id, lastSync'
    });
  }
}

export const db = new ChatDatabase();