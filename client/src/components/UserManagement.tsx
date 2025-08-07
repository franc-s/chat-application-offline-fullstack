import { useState, useEffect } from 'react';
import { UserService, type UserData } from '../services/UserService';

interface UserManagementProps {
  onUserSet: (user: UserData) => void;
  onError: (error: string) => void;
}

export function UserManagement({ onUserSet, onError }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [userService] = useState(() => new UserService());

  useEffect(() => {
    // Try to load existing user data
    const loadExistingUser = async () => {
      try {
        const userData = await userService.getCurrentUser();
        if (userData) {
          onUserSet(userData);
        }
      } catch (error) {
        console.error('Failed to load existing user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingUser();
  }, [userService, onUserSet]);

  const handleNameSet = async (name: string) => {
    try {
      setIsLoading(true);
      const userData = await userService.createOrGetUser(name);
      onUserSet(userData);
      onError(''); // Clear any previous errors
    } catch (error) {
      onError('Failed to set up user: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <UserNamePrompt onNameSet={handleNameSet} />;
}

interface UserNamePromptProps {
  onNameSet: (name: string) => void;
}

function UserNamePrompt({ onNameSet }: UserNamePromptProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    if (trimmedName.length < 2) {
      alert('Username must be at least 2 characters long');
      return;
    }
    
    if (trimmedName.length > 50) {
      alert('Username must be 50 characters or less');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      alert('Username can only contain letters, numbers, underscore, and dash');
      return;
    }

    setIsSubmitting(true);
    try {
      await onNameSet(trimmedName);
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Chat!</h1>
          <p className="text-gray-600">Please enter your username to get started</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your username..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              2-50 characters, letters, numbers, underscore, and dash only
            </p>
          </div>
          
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
