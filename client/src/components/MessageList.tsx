import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Message } from '../lib/db';
import { MessageService } from '../services/MessageService';
import { UserService } from '../services/UserService';
import { MessageStatus } from './StatusIndicator';
import type { UserData } from '../services/UserService';

interface MessageListProps {
  groupId: string;
  user: UserData;
}

export function MessageList({ groupId, user }: MessageListProps) {
  const [messageService] = useState(() => new MessageService());
  const [userService] = useState(() => new UserService());
  const [messagesWithUsernames, setMessagesWithUsernames] = useState<(Message & { senderUsername: string })[]>([]);

  // Get messages from IndexedDB
  const messages = useLiveQuery(() => 
    groupId 
      ? db.messages.where('groupId').equals(groupId).toArray().then(msgs => 
          msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        )
      : []
  , [groupId]) || [];

  // Resolve usernames for messages
  useEffect(() => {
    if (!messages.length) {
      setMessagesWithUsernames([]);
      return;
    }

    const resolveUsernames = async () => {
      try {
        const messagesWithNames = await messageService.getMessagesWithUsernames(
          groupId,
          (userId) => userService.resolveUsername(userId)
        );
        setMessagesWithUsernames(messagesWithNames);
      } catch (error) {
        console.error('Failed to resolve usernames:', error);
        // Fallback: use messages without resolved usernames
        setMessagesWithUsernames(messages.map(msg => ({
          ...msg,
          senderUsername: msg.senderId
        })));
      }
    };

    resolveUsernames();
  }, [messages, groupId, messageService, userService]);

  if (!groupId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
        <div>
          <div className="text-4xl mb-4">💬</div>
          <div className="text-lg mb-2">Welcome to Chat!</div>
          <div className="text-sm">
            Select a group from the sidebar to join and start chatting
          </div>
        </div>
      </div>
    );
  }

  if (messagesWithUsernames.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
        <div>
          <div className="text-4xl mb-4">💭</div>
          <div className="text-lg mb-2">No messages yet</div>
          <div className="text-sm">
            Be the first to send a message in this group!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messagesWithUsernames.map((message) => {
        const isOwnMessage = message.senderId === user.userId;
        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
          />
        );
      })}
    </div>
  );
}

interface MessageItemProps {
  message: Message & { senderUsername: string };
  isOwnMessage: boolean;
}

function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-2`}>
      <div className={`rounded-lg p-3 shadow-sm max-w-xs sm:max-w-md md:max-w-lg ${
        isOwnMessage 
          ? 'bg-blue-500 text-white ml-4 sm:ml-8 md:ml-12' 
          : 'bg-white text-gray-900 mr-4 sm:mr-8 md:mr-12'
      }`}>
        {!isOwnMessage && (
          <div className="text-sm font-medium opacity-75 mb-1">
            {message.senderUsername}
          </div>
        )}
        <div className="mb-1">{message.body}</div>
        <div className={`text-xs flex items-center justify-end gap-1 ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </span>
          {isOwnMessage && (
            <MessageStatus 
              status={message.status}
              serverSeq={message.serverSeq}
            />
          )}
        </div>
      </div>
    </div>
  );
}
