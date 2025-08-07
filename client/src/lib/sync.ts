import { db, type OutboxItem } from './db';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export class SyncService {
  private syncCursor: number = 0;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(isSyncing: boolean) => void> = new Set();

  constructor() {
    this.loadCursor();
    this.setupOnlineListener();
    this.startSyncInterval();

    // Trigger immediate sync if online
    if (this.isOnline) {
      this.sync();
    }
  }

  // Add listener for sync status changes
  addSyncListener(listener: (isSyncing: boolean) => void) {
    this.listeners.add(listener);
    // Immediately notify of current state
    listener(this.isSyncing);
  }

  removeSyncListener(listener: (isSyncing: boolean) => void) {
    this.listeners.delete(listener);
  }

  private notifySyncListeners() {
    this.listeners.forEach(listener => listener(this.isSyncing));
  }

  private loadCursor() {
    const stored = localStorage.getItem('sync-cursor');
    this.syncCursor = stored ? parseInt(stored) : 0;
  }

  private saveCursor() {
    localStorage.setItem('sync-cursor', this.syncCursor.toString());
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startSyncInterval() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 10 seconds (reduced from 5 to prevent UI glitches)
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 10000);
  }

  // Method to stop syncing (useful for cleanup)
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync() {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.notifySyncListeners();

    const startTime = Date.now();
    let syncedCount = 0;

    try {
      await this.flushOutbox();
      const result = await this.pullEvents();
      syncedCount = result || 0;

      // Update sync metrics
      await this.updateSyncMetrics(syncedCount, 0, Date.now() - startTime);

    } catch (error) {
      console.warn('Sync failed:', error);
      await this.updateSyncMetrics(0, 1, Date.now() - startTime);

      // Exponential backoff for failed syncs
      setTimeout(() => {
        if (this.isOnline && !this.isSyncing) {
          this.sync();
        }
      }, Math.min(30000, 5000 * Math.pow(2, Math.random()))); // 5-30s random backoff
    } finally {
      this.isSyncing = false;
      this.notifySyncListeners();
    }
  }

  private async updateSyncMetrics(synced: number, failed: number, duration: number) {
    try {
      const existing = await db.syncMetrics.get('main');
      const metrics = {
        id: 'main',
        lastSync: new Date(),
        totalSynced: (existing?.totalSynced || 0) + synced,
        failedCount: (existing?.failedCount || 0) + failed,
        avgSyncTime: existing
          ? (existing.avgSyncTime + duration) / 2
          : duration
      };

      await db.syncMetrics.put(metrics);
    } catch (error) {
      // Silently fail sync metrics update
    }
  }

  /**
   * Handle group synchronization - now simplified since IDs are consistent
   * Frontend generates CUIDs that are used by both client and server
   */
  private async handleGroupSync(serverGroup: any) {
    // Simply update/add the group since IDs are now consistent
    await db.groups.put(serverGroup);
  }

  private async flushOutbox() {
    const pending = await db.outbox.where('status').anyOf(['pending', 'failed']).toArray();
    
    for (const item of pending) {
      // Exponential backoff for failed items
      if (item.status === 'failed' && item.lastAttempt) {
        const retryDelay = Math.min(30000, 1000 * Math.pow(2, item.retryCount || 0));
        if (Date.now() - item.lastAttempt.getTime() < retryDelay) {
          continue;
        }
      }
      
      try {
        await db.outbox.update(item.id, { 
          status: 'syncing',
          lastAttempt: new Date(),
          retryCount: (item.retryCount || 0) + 1
        });
        
        await this.sendOutboxItem(item);
        
        await db.outbox.update(item.id, { status: 'synced' });
        
        if (item.type === 'message') {
          await db.messages.update(item.data.id, { status: 'sent' });
        }
      } catch (error) {
        const retryCount = (item.retryCount || 0) + 1;
        const maxRetries = 5;
        
        await db.outbox.update(item.id, { 
          status: retryCount >= maxRetries ? 'failed' : 'pending',
          error: (error as Error).message,
          retryCount,
          lastAttempt: new Date()
        });
        
        if (item.type === 'message') {
          await db.messages.update(item.data.id, { 
            status: retryCount >= maxRetries ? 'failed' : 'sending' 
          });
        }
        
        // Log warning for failed sync attempts
      }
    }
  }

  private async sendOutboxItem(item: OutboxItem) {
    switch (item.type) {
      case 'group':
        await fetch(`${API_BASE}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;
        
      case 'message':
        await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;
        
      case 'membership':
        await fetch(`${API_BASE}/groups/${item.data.groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: item.data.userId })
        });
        break;
        
      case 'delete-group':
        await fetch(`${API_BASE}/groups/${item.data.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: item.data.userId })
        });
        break;
    }
  }

  private async pullEvents(limit = 100): Promise<number> {
    let totalSynced = 0;

    // Get current user for privacy filtering
    const userData = localStorage.getItem('chat-user-data');
    if (!userData) {
      return 0; // No user logged in, can't sync
    }

    const { userId } = JSON.parse(userData);

    try {
      // Pull messages (with privacy filtering)
      const messagesUrl = `${API_BASE}/events/messages?since=${this.syncCursor}&limit=${limit}&userId=${userId}`;
      const messagesResponse = await fetch(messagesUrl);

      if (!messagesResponse.ok) {
        throw new Error(`Messages sync failed: ${messagesResponse.status} ${messagesResponse.statusText}`);
      }

      const messagesData = await messagesResponse.json();

      // Pull groups (public)
      const groupsUrl = `${API_BASE}/events/groups?since=${this.syncCursor}&limit=${limit}`;
      const groupsResponse = await fetch(groupsUrl);

      if (!groupsResponse.ok) {
        throw new Error(`Groups sync failed: ${groupsResponse.status} ${groupsResponse.statusText}`);
      }

      const groupsData = await groupsResponse.json();

      // Combine and sort events by serverSeq
      const events = [
        ...(messagesData.events || []),
        ...(groupsData.events || [])
      ].sort((a, b) => (a.serverSeq || 0) - (b.serverSeq || 0));

      if (!events || events.length === 0) {
        // If we get no events but our cursor is > 0, the server might have been reset
        if (this.syncCursor > 0) {
          this.syncCursor = 0;
          this.saveCursor();
          return this.pullEvents(limit); // Try again from 0
        }
        return 0;
      }

      for (const event of events) {
        if (event.type === 'message') {
          await db.messages.put(event);
          if (event.group) {
            await this.handleGroupSync(event.group);
          }
        } else if (event.type === 'group') {
          await this.handleGroupSync(event);
        }

        if (event.serverSeq > this.syncCursor) {
          this.syncCursor = event.serverSeq;
        }
      }

      totalSynced = events.length;
      this.saveCursor();

      return totalSynced;

    } catch (error) {
      console.error('Pull events error:', error);
      throw error;
    }
  }

  async addToOutbox(type: OutboxItem['type'], data: any) {
    const item: OutboxItem = {
      id: crypto.randomUUID(),
      type,
      data,
      status: 'pending',
      createdAt: new Date()
    };
    
    await db.outbox.add(item);
    
    if (this.isOnline) {
      this.sync();
    }
  }

  // New method for online-first writes (LWW approach)
  async writeOnlineFirst(type: OutboxItem['type'], data: any) {
    if (!this.isOnline) {
      // Fallback to outbox approach when offline
      return this.addToOutbox(type, data);
    }

    try {
      // Try to write directly to backend first
      const backendResult = await this.sendDirectToBackend(type, data);

      // Add the backend result to local DB
      if (type === 'message') {
        await db.messages.add({ ...backendResult, status: 'sent' });
      } else if (type === 'group') {
        await db.groups.add(backendResult);
      } else if (type === 'delete-group') {
        // Hard delete from local DB
        await db.groups.delete(data.id);
        // Also remove related messages and memberships
        await db.messages.where('groupId').equals(data.id).delete();
        await db.memberships.where('groupId').equals(data.id).delete();
      }

      // Trigger sync to ensure consistency
      await this.sync();

      return backendResult;
    } catch (error) {
      // If backend write fails, fall back to outbox
      await this.addToOutbox(type, data);
      throw error;
    }
  }

  private async sendDirectToBackend(type: OutboxItem['type'], data: any) {
    switch (type) {
      case 'group':
        const groupResponse = await fetch(`${API_BASE}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!groupResponse.ok) {
          throw new Error(`Failed to create group: ${groupResponse.status}`);
        }
        return await groupResponse.json();
        
      case 'message':
        const messageResponse = await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!messageResponse.ok) {
          throw new Error(`Failed to send message: ${messageResponse.status}`);
        }
        return await messageResponse.json();
        
      case 'membership':
        const membershipResponse = await fetch(`${API_BASE}/groups/${data.groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.userId })
        });
        if (!membershipResponse.ok) {
          throw new Error(`Failed to join group: ${membershipResponse.status}`);
        }
        return await membershipResponse.json();
        
      case 'delete-group':
        const deleteResponse = await fetch(`${API_BASE}/groups/${data.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.userId })
        });
        if (!deleteResponse.ok) {
          throw new Error(`Failed to delete group: ${deleteResponse.status}`);
        }
        return await deleteResponse.json();
        
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  getOnlineStatus() {
    return this.isOnline;
  }
}

export const syncService = new SyncService();