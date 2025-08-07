import type { GroupRepository } from '../repositories/GroupRepository.js';
import type { UserService } from './UserService.js';
import type { MembershipRepository } from '../repositories/MembershipRepository.js';
import type { CreateGroupDto, GroupResponseDto, DeleteGroupDto, JoinGroupDto } from '../models/Group.js';

export class GroupService {
  constructor(
    private groupRepository: GroupRepository,
    private userService: UserService,
    private membershipRepository: MembershipRepository
  ) {}

  async createOrUpdateGroup(groupData: CreateGroupDto): Promise<GroupResponseDto> {
    // Validate user exists
    const userExists = await this.userService.validateUserExists(groupData.createdBy);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Frontend generates both IDs and timestamps for offline-first consistency
    try {
      const group = await this.groupRepository.upsert(groupData);

      // Automatically add creator as member
      try {
        await this.membershipRepository.create(group.createdBy, group.id);
      } catch (membershipError: any) {
        // Ignore if membership already exists (idempotent)
        if (membershipError.code !== 'P2002') {
          throw membershipError;
        }
      }

      // Get creator username for response
      const creator = await this.userService.getUserById(group.createdBy);

      return {
        ...group,
        createdByUsername: creator?.username || 'Unknown User'
      };
    } catch (error: any) {
      // Handle database constraint violations
      if (error.code === 'P2002') {
        // Check if it's a duplicate ID or duplicate name
        if (error.meta?.target?.includes('id')) {
          // Duplicate ID - return existing group
          const existingGroup = await this.groupRepository.findById(groupData.id);
          if (existingGroup) {
            // Ensure creator is a member
            try {
              await this.membershipRepository.create(existingGroup.createdBy, existingGroup.id);
            } catch (membershipError: any) {
              // Ignore if membership already exists
              if (membershipError.code !== 'P2002') {
                throw membershipError;
              }
            }

            const creator = await this.userService.getUserById(existingGroup.createdBy);
            return {
              ...existingGroup,
              createdByUsername: creator?.username || 'Unknown User'
            };
          }
        } else if (error.meta?.target?.includes('name') || error.constraint?.includes('name')) {
          // Duplicate name - database constraint violation
          throw new Error('Group name already exists');
        }
      }
      throw error;
    }
  }

  async deleteGroup(groupId: string, deleteData: DeleteGroupDto): Promise<GroupResponseDto> {
    // Validate user exists
    const userExists = await this.userService.validateUserExists(deleteData.userId);
    if (!userExists) {
      throw new Error('Invalid user - user not found');
    }

    // Check if group exists and user is the creator
    const existingGroup = await this.groupRepository.findById(groupId);
    if (!existingGroup) {
      throw new Error('Group not found');
    }

    if (existingGroup.createdBy !== deleteData.userId) {
      throw new Error('Only the group creator can delete this group');
    }

    // Get creator info before deletion
    const creator = await this.userService.getUserById(existingGroup.createdBy);

    // Hard delete the group (CASCADE will delete related messages and memberships)
    const deletedGroup = await this.groupRepository.delete(groupId);

    return {
      ...deletedGroup,
      createdByUsername: creator?.username || 'Unknown User'
    };
  }

  async joinGroup(groupId: string, joinData: JoinGroupDto): Promise<{ success: boolean }> {
    // Validate user exists
    const userExists = await this.userService.validateUserExists(joinData.userId);
    if (!userExists) {
      throw new Error('Invalid user - user not found');
    }

    // Validate group exists
    const groupExists = await this.groupRepository.exists(groupId);
    if (!groupExists) {
      throw new Error('Group not found');
    }

    try {
      await this.membershipRepository.create(joinData.userId, groupId);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2002') {
        // User already in group - idempotent
        return { success: true };
      }
      throw error;
    }
  }

  async getAllGroups(): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.findAll();

    // Add creator usernames
    const userIds = groups.map(g => g.createdBy);
    const usernameMap = await this.userService.getUsernameMap(userIds);

    return groups.map(group => ({
      ...group,
      createdByUsername: usernameMap.get(group.createdBy) || 'Unknown User'
    }));
  }

  async getGroupsByServerSeq(sinceSeq: number, limit: number): Promise<any[]> {
    return await this.groupRepository.findByServerSeq(sinceSeq, limit);
  }
}
