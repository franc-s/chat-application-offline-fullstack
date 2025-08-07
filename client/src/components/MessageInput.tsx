import { useState } from 'react';
import { MessageService } from '../services/MessageService';
import type { UserData } from '../services/UserService';

interface MessageInputProps {
  groupId: string;
  user: UserData;
  isOnline: boolean;
  onError: (error: string) => void;
}

export function MessageInput({ groupId, user, isOnline, onError }: MessageInputProps) {
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageService] = useState(() => new MessageService());

  const sendMessage = async () => {
    if (!messageBody?.trim() || isSending) return;

    const messageToSend = messageBody.trim();
    setMessageBody('');
    setIsSending(true);

    try {
      await messageService.sendMessage(groupId, messageToSend, user, isOnline);
      onError(''); // Clear any previous errors
    } catch (error) {
      // Restore message on error
      setMessageBody(messageToSend);
      onError((error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const remainingChars = 500 - messageBody.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="border-t border-gray-200 p-3 sm:p-4">
      {/* Character counter */}
      {messageBody.length > 400 && (
        <div className={`text-xs mb-2 text-right ${
          isOverLimit ? 'text-red-500' : 'text-gray-500'
        }`}>
          {remainingChars} characters remaining
        </div>
      )}
      
      <div className="flex gap-2 sm:gap-3">
        <textarea
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          placeholder="Type a message..."
          className={`flex-1 px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none ${
            isOverLimit ? 'border-red-300' : 'border-gray-300'
          }`}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          rows={1}
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            resize: 'none'
          }}
          onInput={(e) => {
            // Auto-resize textarea
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!messageBody.trim() || isSending || isOverLimit}
          className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {/* Helpful hints */}
      <div className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
