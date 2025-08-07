export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  serverSeq: number;
}

export interface CreateMessageDto {
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface MessageResponseDto {
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  serverSeq: number;
  senderUsername?: string;
}



export interface MessageEventDto {
  type: 'message';
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  serverSeq: number;
  senderUsername: string;
}

export interface GroupEventDto {
  type: 'group';
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  serverSeq: number;
  createdByUsername: string;
}
