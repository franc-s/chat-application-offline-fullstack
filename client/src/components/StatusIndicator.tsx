interface StatusIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  className?: string;
}

export function StatusIndicator({ isOnline, isSyncing, className = "" }: StatusIndicatorProps) {
  if (isSyncing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-40"></div>
        </div>
        <span className="text-blue-600 font-medium">Syncing...</span>
      </div>
    );
  }

  if (isOnline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </div>
        <span className="text-green-600 font-medium">Connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-300 rounded-full opacity-60"></div>
      </div>
      <span className="text-orange-600 font-medium">Offline</span>
    </div>
  );
}

interface MessageStatusProps {
  status?: 'sending' | 'sent' | 'failed';
  serverSeq?: number;
}

export function MessageStatus({ status, serverSeq }: MessageStatusProps) {
  if (serverSeq) {
    return (
      <span className="text-blue-200" title="Delivered">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z"/>
          <path d="M5.354 7.146.646 2.439a.5.5 0 0 1 .708-.708L5 5.377 13.646 1.146a.5.5 0 0 1 .708.708L6.707 6.707a.5.5 0 0 1-.708 0z"/>
        </svg>
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span className="text-blue-200" title="Sent">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
        </svg>
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="text-red-300" title="Failed to send">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
        </svg>
      </span>
    );
  }

  return (
    <span className="text-blue-200" title="Sending">
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
        <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
      </svg>
    </span>
  );
}