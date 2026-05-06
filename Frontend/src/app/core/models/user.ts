export interface User {
  id: string;
  email: string;
  username: string;
  role: 'User' | 'Manager' | 'Admin';
  createdAt: Date;
}

export interface AuthResponseDto {
  token: string;
  userId: string;
  email: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
}