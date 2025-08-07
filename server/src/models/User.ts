export interface User {
  id: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  username: string;
}

export interface UserResponseDto {
  id: string;
  username: string;
  createdAt: Date;
}
