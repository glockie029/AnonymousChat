export interface User {
  id: string;
  username: string;
  avatarColor: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string; // Text content or Base64 image string
  type: MessageType;
  timestamp: number;
  avatarColor?: string;
  isStreaming?: boolean; // For AI streaming responses
}

export interface ChatState {
  messages: Message[];
  currentUser: User | null;
  isConnected: boolean;
}