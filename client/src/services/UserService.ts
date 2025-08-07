import { db } from '../lib/db';

export interface UserData {
  userId: string;
  username: string;
}

export class UserService {
  private static readonly STORAGE_KEY = 'chat-user-data';
  private static readonly API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174';

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const stored = localStorage.getItem(UserService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Create user on server or fetch existing, handling 409 conflicts gracefully
   */
  async createOrGetUser(username: string): Promise<UserData> {
    this.validateUsername(username);
    const normalizedUsername = username.trim().toLowerCase();

    try {
      const userData = await this.createOrFetchUser(normalizedUsername);
      await this.storeUserData(userData);
      return userData;
    } catch (error) {
      console.error('Failed to create/get user:', error);
      throw error;
    }
  }

  private validateUsername(username: string): void {
    if (!username?.trim()) {
      throw new Error('Username is required');
    }

    const trimmed = username.trim();
    if (trimmed.length < 2) {
      throw new Error('Username must be at least 2 characters');
    }

    if (trimmed.length > 50) {
      throw new Error('Username too long (max 50 characters)');
    }
  }

  private async createOrFetchUser(normalizedUsername: string): Promise<UserData> {
    const response = await fetch(`${UserService.API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normalizedUsername })
    });

    if (response.ok) {
      const user = await response.json();
      return this.createUserData(user);
    } else if (response.status === 409) {
      return await this.fetchExistingUser(normalizedUsername);
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create user');
    }
  }

  private async fetchExistingUser(username: string): Promise<UserData> {
    const userResponse = await fetch(`${UserService.API_BASE}/users/${username}`);
    if (userResponse.ok) {
      const user = await userResponse.json();
      return this.createUserData(user);
    } else {
      throw new Error('Failed to get existing user');
    }
  }

  private createUserData(user: any): UserData {
    return {
      userId: user.id,
      username: user.username
    };
  }

  private async storeUserData(userData: UserData): Promise<void> {
    localStorage.setItem(UserService.STORAGE_KEY, JSON.stringify(userData));
    await this.cacheUserInfo(userData.userId, userData.username);
  }

  /**
   * Cache user info locally for username resolution and offline access
   */
  private async cacheUserInfo(userId: string, username: string, createdAt?: Date): Promise<void> {
    await db.users.put({
      id: userId,
      username: username,
      createdAt: createdAt || new Date(),
      lastSeen: new Date()
    });
  }

  async clearUserData(): Promise<void> {
    localStorage.removeItem(UserService.STORAGE_KEY);
  }

  /**
   * Resolve userId to username with local cache fallback and server fetch
   */
  async resolveUsername(userId: string): Promise<string> {
    const cachedUser = await db.users.get(userId);
    if (cachedUser) {
      return cachedUser.username;
    }

    try {
      const user = await this.fetchUserFromServer(userId);
      if (user) {
        await this.cacheUserInfo(user.id, user.username, new Date(user.createdAt));
        return user.username;
      }
    } catch (error) {
      console.warn('Failed to resolve username:', error);
    }

    return userId;
  }

  private async fetchUserFromServer(userId: string): Promise<any | null> {
    const response = await fetch(`${UserService.API_BASE}/users/id/${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  }


}
