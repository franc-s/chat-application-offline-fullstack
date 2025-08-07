import type { UserRepository } from '../repositories/UserRepository.js';
import type { CreateUserDto, UserResponseDto } from '../models/User.js';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.create({
        username: userData.username.trim().toLowerCase()
      });
      
      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Username already taken');
      }
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByUsername(username.trim().toLowerCase());
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    };
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    // Add retry logic to handle race conditions where user was just created
    // but database transaction hasn't fully committed yet
    const maxRetries = 3;
    const retryDelay = 100; // 100ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const user = await this.userRepository.findById(id);

      if (user) {
        return {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        };
      }

      // If not found and we have retries left, wait and try again
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }

  async validateUserExists(id: string): Promise<boolean> {
    // Add retry logic to handle race conditions where user was just created
    // but database transaction hasn't fully committed yet
    const maxRetries = 3;
    const retryDelay = 100; // 100ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const exists = await this.userRepository.exists(id);
      if (exists) {
        return true;
      }

      // If not found and we have retries left, wait and try again
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return false;
  }

  async getUsernameMap(userIds: string[]): Promise<Map<string, string>> {
    const users = await this.userRepository.findByIds(userIds);
    const map = new Map<string, string>();
    
    users.forEach(user => {
      map.set(user.id, user.username);
    });
    
    return map;
  }
}
