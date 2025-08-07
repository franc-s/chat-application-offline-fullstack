export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  serverSeq: number;
}

export interface CreateGroupDto {
  id: string; // Frontend-generated CUID
  name: string;
  createdBy: string;
  updatedAt: string; // Frontend-generated timestamp for offline-first consistency
}

export interface GroupResponseDto {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  serverSeq: number;
  createdByUsername: string;
}

export interface DeleteGroupDto {
  userId: string;
}

export interface JoinGroupDto {
  userId: string;
}
