import { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

import { UserManagement } from './UserManagement';
import { GroupList } from './GroupList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

import { ToastContainer, useToasts } from './Toast';
import type { UserData } from '../services/UserService';

export function ChatApp() {
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const isOnline = useOnlineStatus();
  const { toasts, dismissToast, showError } = useToasts();



  // Show user management if no user is set
  if (!user) {
    return (
      <>
        <UserManagement onUserSet={setUser} onError={showError} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-gray-900">Chat Groups</h1>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="mb-2 text-sm text-gray-600">
          Logged in as <span className="font-medium">{user.username}</span>
        </div>
      </div>

      {/* Sidebar with Groups */}
      <div className="flex-shrink-0">
        <div className="hidden md:block p-4 bg-white border-r border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">Available Groups</h1>
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <div className="mb-4 text-sm text-gray-600">
            Logged in as <span className="font-medium">{user.username}</span>
          </div>
        </div>
        
        <GroupList
          user={user}
          selectedGroupId={selectedGroupId}
          onGroupSelect={setSelectedGroupId}
          isOnline={isOnline}
          onError={showError}
        />
        
        {/* Connection status footer */}
        <div className="p-4 border-t border-gray-200 bg-white text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {isOnline ? 'Connected' : 'Offline - Changes will sync when online'}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedGroupId ? (
          <>
            <MessageList groupId={selectedGroupId} user={user} />
            <MessageInput
              groupId={selectedGroupId}
              user={user}
              isOnline={isOnline}
              onError={showError}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
            <div>
              <div className="text-4xl mb-4">💬</div>
              <div className="text-lg mb-2">Welcome to Chat!</div>
              <div className="text-sm">
                Select a group from the sidebar to join and start chatting
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
