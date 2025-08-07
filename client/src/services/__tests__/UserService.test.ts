import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../UserService';

// Mock fetch
global.fetch = vi.fn();

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should create user successfully', async () => {
    const mockResponse = {
      id: 'user-123',
      username: 'newuser',
      createdAt: new Date().toISOString()
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await userService.createOrGetUser('newuser');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser' })
      })
    );

    expect(result).toEqual({
      userId: mockResponse.id,
      username: mockResponse.username
    });

    // Should store user data in localStorage
    const stored = JSON.parse(localStorage.getItem('chat-user-data')!);
    expect(stored).toEqual({
      userId: mockResponse.id,
      username: mockResponse.username
    });
  });

  it('should handle validation errors', async () => {
    await expect(userService.createOrGetUser('')).rejects.toThrow('Username is required');
    await expect(userService.createOrGetUser('a')).rejects.toThrow('Username must be at least 2 characters');
  });

  it('should return stored user data', async () => {
    const userData = { userId: 'test-id', username: 'testuser' };
    localStorage.setItem('chat-user-data', JSON.stringify(userData));

    const user = await userService.getCurrentUser();
    expect(user).toEqual(userData);
  });
});
