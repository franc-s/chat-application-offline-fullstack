import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Group } from '../lib/db';
import { GroupService } from '../services/GroupService';
import { UserService } from '../services/UserService';
import type { UserData } from '../services/UserService';

interface GroupListProps {
  user: UserData;
  selectedGroupId: string;
  onGroupSelect: (groupId: string) => void;
  isOnline: boolean;
  onError: (error: string) => void;
}

export function GroupList({ 
  user, 
  selectedGroupId, 
  onGroupSelect, 
  isOnline, 
  onError 
}: GroupListProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [groupService] = useState(() => new GroupService());
  const [userService] = useState(() => new UserService());

  // Get groups from IndexedDB (no need to filter - hard delete removes them)
  const groups = useLiveQuery(() =>
    db.groups.toArray()
  ) || [];

  const createGroup = async () => {
    if (!newGroupName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const group = await groupService.createGroup(newGroupName, user, isOnline);
      onGroupSelect(group.id);
      setNewGroupName('');
      // Success - no need to call onError
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    // Check if current user is the creator
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      onError('Group not found');
      return;
    }

    if (group.createdBy !== user.userId) {
      onError('Only the group creator can delete this group');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await groupService.deleteGroup(groupId, user, isOnline);

      if (selectedGroupId === groupId) {
        onGroupSelect('');
      }
      // Success - no need to call onError
    } catch (error) {
      onError((error as Error).message);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      await groupService.joinGroup(groupId, user, isOnline);
      onGroupSelect(groupId);
      // Success - no need to call onError
    } catch (error) {
      onError((error as Error).message);
    }
  };

  // Get creator display name
  const getCreatorDisplay = (group: Group): string => {
    if (group.createdBy === user.userId) {
      return 'you';
    }

    // Use the createdByUsername from backend if available
    return (group as any).createdByUsername || 'Unknown User';
  };

  return (
    <div className="w-full md:w-64 lg:w-80 bg-white border-r border-gray-200 flex flex-col max-h-64 md:max-h-none overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Available Groups</h1>
        
        {/* Create Group Form */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Create New Group</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              disabled={isCreating}
            />
            <button
              onClick={createGroup}
              disabled={!newGroupName.trim() || isCreating}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? '...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <div className="mb-2">💬</div>
            <div>No groups yet</div>
            <div className="text-xs mt-1">Create your first group above</div>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-700 uppercase tracking-wide">
              Groups ({groups.length})
            </div>
            {groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                isOwner={group.createdBy === user.userId}
                onSelect={() => joinGroup(group.id)}
                onDelete={() => deleteGroup(group.id)}
                getCreatorDisplay={getCreatorDisplay}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface GroupItemProps {
  group: Group;
  isSelected: boolean;
  isOwner: boolean;
  onSelect: () => void;
  onDelete: () => void;
  getCreatorDisplay: (group: Group) => string;
}

function GroupItem({
  group,
  isSelected,
  isOwner,
  onSelect,
  onDelete,
  getCreatorDisplay
}: GroupItemProps) {
  const creatorDisplay = getCreatorDisplay(group);

  return (
    <div className={`hover:bg-gray-50 ${
      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
    }`}>
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onSelect}
          className="flex-1 text-left"
        >
          <div className="font-medium text-gray-900">{group.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Created by {creatorDisplay} • Click to join
          </div>
        </button>
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-2 p-1 text-red-500 hover:bg-red-100 rounded"
            title="Delete group (you are the creator)"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
